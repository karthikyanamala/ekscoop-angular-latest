// src/app/homepage/homepage.component.ts
import { Component, OnInit, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';

import { HeroComponent } from '../hero/hero.component';
import { FeaturesComponent } from '../features/features.component';
import { MealSectionComponent } from '../meal-section/meal-section.component';
import { ProductShowcaseComponent } from '../product-showcase/product-showcase.component';
import { TrustSectionComponent } from '../trust-section/trust-section.component';
import { CornerBadgeComponent } from '../../corner-badge/corner-badge.component';
import { FooterComponent } from '../../footer/footer.component';
import { ReviewsWidgetComponent } from '../../components/reviews-widget/reviews-widget.component';

import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    HeroComponent,
    CornerBadgeComponent,
    MealSectionComponent,
    TrustSectionComponent,
    FooterComponent,
    FeaturesComponent,
    ProductShowcaseComponent,
    ReviewsWidgetComponent,
    CommonModule,
  ],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  constructor(
    private titleService: Title,
    private metaService: Meta,
    private rs: ReviewService,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  ngOnInit(): void {
    // ── Core SEO copy (homepage) ────────────────────────────────────────────────
    const title = 'Plant Protein Powder for Indian Meals | Unflavoured & Vegan | ekScoop';
    const description =
      'YOU x 0.8 by ekScoop—unflavoured plant protein made for Indian families. Mix easily with roti, dal, poha or curd. Zero taste. Full strength. Diabetic-friendly, lactose-free, vegan.';
    const pageUrl = 'https://www.ekscoop.com/';
    const imageUrl = 'https://www.ekscoop.com/assets/images/og-protein-banner.jpg';

    // Cities we serve (helps LSI/intent without stuffing)
    const cities = [
      'Bengaluru', 'Hyderabad', 'Delhi NCR', 'Noida', 'Greater Noida',
      'Mumbai', 'Vizag', 'Vijayawada'
    ];

    // ── Title + Canonical ──────────────────────────────────────────────────────
    this.titleService.setTitle(title);

    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', pageUrl);

    // Optional locale tags
    this.metaService.updateTag({ property: 'og:locale', content: 'en_IN' });

    // ── Meta Tags (search + social) ────────────────────────────────────────────
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({
      name: 'keywords',
      content: [
        'plant protein India', 'vegan protein powder', 'unflavoured protein',
        'protein for roti', 'dal protein supplement', 'dairy-free protein',
        'diabetic-friendly protein', 'gym protein for vegetarians',
        'mixes in Indian food', ...cities.map(c => `${c.toLowerCase()} plant protein`)
      ].join(', ')
    });
    this.metaService.updateTag({ name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' });

    // Open Graph
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:image', content: imageUrl });
    this.metaService.updateTag({ property: 'og:url', content: pageUrl });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'ekScoop' });

    // Twitter
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: imageUrl });

    // ── JSON-LD (Organization + Product AggregateRating + FAQ) ────────────────
    this.upsertJsonLd('ld-org', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'ekScoop',
      'url': 'https://www.ekscoop.com/',
      'logo': 'https://www.ekscoop.com/assets/images/logo.png',
      'sameAs': [
        'https://www.instagram.com/ekscoop',
        'https://www.facebook.com/ekscoop',
        'https://www.linkedin.com/company/ekscoop'
      ],
      'areaServed': cities
    });

    // Load reviews so we can publish AggregateRating on the homepage
    this.rs.loadReviews().then(() => {
      const ratingValue = this.rs.averageRating() || 0;
      const reviewCount = this.rs.reviews().length || 0;

      this.upsertJsonLd('ld-product', {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'YOU x 0.8 Plant Protein (Unflavoured)',
        'image': imageUrl,
        'brand': { '@type': 'Brand', 'name': 'ekScoop' },
        'category': 'Sports Nutrition',
        'description': description,
        'offers': {
          '@type': 'Offer',
          'priceCurrency': 'INR',
          'availability': 'https://schema.org/InStock',
          'url': pageUrl
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': ratingValue.toString(),
          'reviewCount': reviewCount.toString()
        }
      });
    });

    // Helpful FAQ (rich results)
    this.upsertJsonLd('ld-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'How do I use ekScoop plant protein with Indian meals?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'It is unflavoured and mixes easily into roti dough, dal, poha, curd, and smoothies—no noticeable taste.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Is it vegan and lactose-free?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes. YOU x 0.8 is 100% plant-based, dairy-free and lactose-free.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Is it suitable for diabetics?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'It is designed for daily nutrition and is diabetic-friendly. If you have medical conditions, please consult your physician.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Is it good for gym and recovery?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes—add to your meals or shakes to support daily protein goals, muscle recovery, and energy.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Do you ship to Bengaluru, Hyderabad, Delhi NCR, Noida, Greater Noida, Mumbai, Vizag and Vijayawada?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes, we ship pan-India including those cities.'
          }
        }
      ]
    });
  }

  private upsertJsonLd(id: string, json: object) {
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
