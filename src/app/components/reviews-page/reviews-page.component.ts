// src/app/pages/reviews-page/reviews-page.component.ts
import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { PLATFORM_ID } from '@angular/core';

import { FooterComponent } from '../../footer/footer.component';
import { ReviewsComponent } from '../reviews/reviews.component';
import { CornerBadgeComponent } from '../../corner-badge/corner-badge.component';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [CommonModule, CornerBadgeComponent, ReviewsComponent, FooterComponent],
  template: `
    <app-corner-badge></app-corner-badge>
    <main class="reviews-page-wrap">
      <app-reviews></app-reviews>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    .reviews-page-wrap{
      min-height: 100dvh;
      padding-top: var(--nav-offset, 0px);
      background:
        radial-gradient(1400px 800px at 80% -200px, hsl(16 100% 98%), transparent),
        #fff;
    }
  `]
})
export class ReviewsPageComponent implements OnInit {
  constructor(
    private title: Title,
    private meta: Meta,
    private rs: ReviewService,
    @Inject(DOCUMENT) private doc: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private get isBrowser() { return isPlatformBrowser(this.platformId); }

  async ngOnInit(): Promise<void> {
    // Browser: load reviews, then publish SEO with real numbers.
    if (this.isBrowser) {
      try { await this.rs.loadReviews(); } catch {}
      this.publishSeo();
      return;
    }

    // SSR: publish safe SEO (no 0-counts in title/JSON-LD).
    this.title.setTitle('Customer Reviews | ekScoop Plant Protein');
    this.meta.updateTag({
      name: 'description',
      content:
        'Real reviews from Indian families using YOU x 0.8—unflavoured plant protein that mixes easily with roti, dal, curd and more.'
    });
    this.basicMetaAndCanonical('https://www.ekscoop.com/reviews',
      'Customer Reviews | ekScoop Plant Protein',
      'Real reviews from Indian families using YOU x 0.8—unflavoured plant protein that mixes easily with roti, dal, poha and curd. Great for gym, recovery and daily nutrition. Fast shipping to Bengaluru, Hyderabad, Delhi NCR, Noida, Greater Noida, Mumbai, Vizag and Vijayawada.'
    );

    // IMPORTANT:
    // On SSR we do NOT inject aggregateRating with 0 values.
    // If you want rating stars in Google, fetch rating/count on the server
    // and call publishSeo() with real numbers. (See my previous message.)
    this.upsertJsonLd('ld-reviews', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': 'https://www.ekscoop.com/#product',
      name: 'YOU x 0.8 Plant Protein (Unflavoured)',
      brand: { '@type': 'Brand', name: 'ekScoop' },
      url: 'https://www.ekscoop.com/reviews'
    });
  }

  private publishSeo(): void {
    const ratingValue = Number(this.rs?.averageRating?.() ?? 0) || 0;
    const reviewCount = Number(this.rs?.reviews?.().length ?? 0) || 0;
    const hasReviews = reviewCount > 0;

    const pageUrl = 'https://www.ekscoop.com/reviews';
    const baseTitle = 'Customer Reviews | ekScoop Plant Protein';
    const pageTitle = hasReviews
      ? `${baseTitle} (${ratingValue.toFixed(1)}★, ${reviewCount} reviews)`
      : baseTitle;

    const description =
      'Real customer reviews for ekScoop plant protein—vegan, unflavoured and easy to mix in Indian foods like roti, dal, poha and curd. Great for gym, recovery and daily nutrition. Fast shipping to Bengaluru, Hyderabad, Delhi NCR, Noida, Greater Noida, Mumbai, Vizag and Vijayawada.';

    // Title + description + canonical + OG/Twitter
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: 'index,follow' });
    this.basicMetaAndCanonical(pageUrl, pageTitle, description);

    // Build JSON-LD
    const productJson: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': 'https://www.ekscoop.com/#product', // stable ID reused across pages
      name: 'YOU x 0.8 Plant Protein (Unflavoured)',
      brand: { '@type': 'Brand', name: 'ekScoop' },
      url: pageUrl
    };

    if (hasReviews) {
      const items = this.rs.reviews().slice(0, 10).map(r => ({
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: String(r.rating) },
        author: { '@type': 'Person', name: r.name || 'Customer' },
        reviewBody: r.text,
        datePublished:
          (r.createdAt as any)?.toDate?.()?.toISOString?.() ||
          (r.createdAt as Date)?.toISOString?.() || ''
      }));

      productJson.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: String(ratingValue),
        reviewCount: String(reviewCount)
        // ratingCount: String(reviewCount) // optional
      };
      productJson.review = items;
    }

    this.upsertJsonLd('ld-reviews', productJson);
  }

  private basicMetaAndCanonical(url: string, title: string, description: string) {
    // Canonical
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      this.doc.head.appendChild(link);
    }
    link.href = url;

    // Open Graph / Twitter
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'en_IN' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }

  private upsertJsonLd(id: string, json: object): void {
    let el = this.doc.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = this.doc.createElement('script');
      el.type = 'application/ld+json';
      el.id = id;
      this.doc.head.appendChild(el);
    }
    el.text = JSON.stringify(json);
  }
}
