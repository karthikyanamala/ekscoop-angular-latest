import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

import { CornerBadgeComponent } from '../corner-badge/corner-badge.component';
import { FooterComponent } from '../footer/footer.component';
import { ProductShowcaseComponent } from '../home/product-showcase/product-showcase.component';

// ⬇️ pull in the same reviews service used by the showcase
import { ReviewService } from '../services/review.service';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule, CornerBadgeComponent, FooterComponent, ProductShowcaseComponent],
  template: `
    <app-corner-badge></app-corner-badge>
    <main class="product-wrap">
      <h1 class="sr-only">ekScoop YOU x 0.8 Plant Protein – 40% Off</h1>
      <app-product-showcase></app-product-showcase>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    .product-wrap{max-width:1200px;margin:60px auto;padding:2rem 1rem}
    .sr-only{position:absolute!important;height:1px;width:1px;overflow:hidden;clip:rect(1px,1px,1px,1px);white-space:nowrap;border:0;padding:0;margin:-1px}
  `]
})
export class ProductPageComponent implements OnInit {
  private readonly isBrowser: boolean;

  private product = {
    name: 'ekScoop YOU x 0.8 Plant Protein',
    brand: 'ekScoop',
    url: 'https://www.ekscoop.com/products/you-0-8',
    image: 'https://www.ekscoop.com/assets/products/you-0-8/og-1200x630.jpg',
    price: 1899,
    currency: 'INR',
    discountPercent: 40,
    mrp: 3165,
    sku: 'YOU-08-1KG',
    gtin: '8900000000008',
    availability: 'https://schema.org/InStock',
    // ⬇️ fallback values; we’ll overwrite with live ones below
    ratingValue: 4.8,
    ratingCount: 154,
    category: 'Nutrition > Sports Nutrition > Protein',
  };

  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private doc: Document,
    private rs: ReviewService,                              // ✅ inject reviews
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit(): Promise<void> {
    // 1) Load reviews in the browser so SEO can use live rating values
    if (this.isBrowser) {
      try { await this.rs.loadReviews(); } catch {}
    }

    // 2) Use live values if available
    const liveAvg  = this.rs.averageRating() || this.product.ratingValue;
    const liveCnt  = this.rs.reviews().length || this.product.ratingCount;
    this.product.ratingValue = +liveAvg.toFixed(1);
    this.product.ratingCount = liveCnt;

    // 3) Title & meta
    const pageTitle = `${this.product.name} | ${this.product.discountPercent}% Off – Only ₹${this.product.price} | ekScoop India`;
    const description =
      `Grab ${this.product.name} at ${this.product.discountPercent}% OFF – now just ₹${this.product.price}. ` +
      `Clean, high-quality plant protein with great mixability and easy digestion. Free, fast delivery across India.`;
    const keywords = [
      'plant protein','vegan protein powder','ekScoop YOU x 0.8','YOU 0.8 protein',
      'best plant protein India','lactose free protein','unflavoured protein',
      '40% off protein','₹1899 protein deal','ekScoop'
    ].join(', ');

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    // 4) Canonical (deduped)
    let link = this.doc.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      this.doc.head.appendChild(link);
    }
    link.href = this.product.url;

    // 5) OG / Twitter
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: this.product.url });
    this.meta.updateTag({ property: 'og:image', content: this.product.image });
    this.meta.updateTag({ property: 'product:price:amount', content: String(this.product.price) });
    this.meta.updateTag({ property: 'product:price:currency', content: this.product.currency });
    this.meta.updateTag({ property: 'product:availability', content: 'in stock' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: this.product.image });

    // 6) JSON-LD (deduped with ids) – now includes live rating/count
    this.upsertJsonLd('ld-product',     this.buildProductSchema());
    this.upsertJsonLd('ld-breadcrumbs', this.buildBreadcrumbSchema());
    this.upsertJsonLd('ld-faq',         this.buildFaqSchema());
  }

  private upsertJsonLd(id: string, schemaObj: unknown) {
    let el = this.doc.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = this.doc.createElement('script');
      el.id = id;
      el.type = 'application/ld+json';
      this.doc.head.appendChild(el);
    }
    el.text = JSON.stringify(schemaObj);
  }

  private buildProductSchema() {
    const offer = {
      '@type': 'Offer',
      url: this.product.url,
      priceCurrency: this.product.currency,
      price: String(this.product.price),
      availability: this.product.availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'ekScoop' }
    };

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: this.product.name,
      image: [this.product.image],
      description:
        `High-quality plant protein with clean profile, great mixability and easy digestion. ` +
        `Limited-time ${this.product.discountPercent}% OFF – only ₹${this.product.price}.`,
      sku: this.product.sku,
      ...(this.product.gtin ? { gtin13: this.product.gtin } : {}),
      brand: { '@type': 'Brand', name: this.product.brand },
      category: this.product.category,
      offers: offer,
      ...(this.product.ratingCount > 0 ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(this.product.ratingValue),
          reviewCount: String(this.product.ratingCount)
        }
      } : {})
    };
  }

  private buildBreadcrumbSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',     item: 'https://www.ekscoop.com/' },
        { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://www.ekscoop.com/products' },
        { '@type': 'ListItem', position: 3, name: this.product.name, item: this.product.url }
      ]
    };
  }

  private buildFaqSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is ekScoop YOU x 0.8 Plant Protein?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A clean, high-quality plant protein blend designed for daily use with great mixability and easy digestion, suitable for veg and lactose-free lifestyles.'
          }
        },
        {
          '@type': 'Question',
          name: 'What is the current price and discount?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Limited-time launch offer: ${this.product.discountPercent}% OFF. Pay only ₹${this.product.price} (inclusive of taxes).`
          }
        },
        {
          '@type': 'Question',
          name: 'Do you offer fast delivery across India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, we ship pan-India with free, fast delivery on this launch offer.'
          }
        },
        {
          '@type': 'Question',
          name: 'Is it easy to digest and mix?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. YOU x 0.8 is formulated for smooth mixability and light digestion when used as directed.'
          }
        }
      ]
    };
  }
}
