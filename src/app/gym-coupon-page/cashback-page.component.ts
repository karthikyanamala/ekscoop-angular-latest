// app/pages/cashback-page/cashback-page.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { CornerBadgeComponent } from '../corner-badge/corner-badge.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-cashback-page',
  standalone: true,
  imports: [CommonModule,CornerBadgeComponent,FooterComponent],
  templateUrl: './cashback-page.component.html',
  styleUrls: ['./cashback-page.component.css']
})
export class CashbackPageComponent {
  // JSON-LD schema will render as raw text (good for SSR)
  schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Offer",
    "name": "Gym Membership Cashback – ₹1,000 Coupon",
    "description": "Buy Ekscoop YOU x 0.8. Comment your Order ID on Instagram to win 100% cashback up to ₹1,000 on your gym membership.",
    "brand": {
      "@type": "Brand",
      "name": "Ekscoop"
    },
    "areaServed": "IN",
    "priceCurrency": "INR",
    "category": "Health & Fitness",
    "eligibleRegion": { "@type": "Country", "name": "India" },
    "url": "https://www.ekscoop.com/gym-cashback",
    "seller": { "@type": "Organization", "name": "Ekscoop" }
  });

  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private doc: Document
  ) {
    // --- SEO ---
    const pageTitle = 'Gym Membership Cashback ₹1,000 | Ekscoop YOU x 0.8';
    const description =
      'Claim up to ₹1,000 cashback on your gym membership. Order Ekscoop YOU x 0.8, comment your Review on Instagram, and get fast payout—no questions asked.';
    const keywords = [
      'gym membership cashback',
      '₹1000 gym coupon',
      'gym cashback India',
      'fitness cashback offer',
      'Ekscoop YOU x 0.8',
      'plant protein unflavoured',
      'instagram comment cashback',
      'health coupon India',
      'UPI bank cashback',
      'cashback offer India'
    ].join(', ');

    this.title.setTitle(pageTitle);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.ekscoop.com/gym-cashback' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.ekscoop.com/assets/gym-cashback-og.jpg' });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: 'https://www.ekscoop.com/assets/gym-cashback-og.jpg' });

    // Canonical (SSR-safe)
    const existing = this.doc.querySelector("link[rel='canonical']");
    const link = existing ?? this.doc.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', 'https://www.ekscoop.com/gym-cashback');
    if (!existing) this.doc.head.appendChild(link);
  }
}
