import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

import { CornerBadgeComponent } from '../corner-badge/corner-badge.component';
import { FooterComponent } from '../footer/footer.component';
import { ProductShowcaseComponent } from '../home/product-showcase/product-showcase.component';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [
    CommonModule,
    CornerBadgeComponent,
    FooterComponent,
    ProductShowcaseComponent,
  ],
  template: `
    <app-corner-badge></app-corner-badge>
    <main class="product-wrap">
      <h1 class="sr-only">ekScoop YOU x 0.8 Plant Protein – 40% Off</h1>
      <app-product-showcase></app-product-showcase>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    .product-wrap {
      max-width: 1200px;
      margin: 60px auto;
      padding: 2rem 1rem;
    }
    /* a11y: only for screen readers */
    .sr-only {
      position: absolute !important;
      height: 1px; width: 1px;
      overflow: hidden; clip: rect(1px, 1px, 1px, 1px);
      white-space: nowrap; border: 0; padding: 0; margin: -1px;
    }
  `]
})
export class ProductPageComponent implements OnInit {
  // === Editable product SEO constants (keep these in one place) ===
  private product = {
    name: 'ekScoop YOU x 0.8 Plant Protein',
    brand: 'ekScoop',
    // public product URL (update if your route differs)
    url: 'https://www.ekscoop.com/products/you-0-8',
    // hero image (1200x630 recommended for social)
    image: 'https://www.ekscoop.com/assets/products/you-0-8/og-1200x630.jpg',
    // price info (current discounted price)
    price: 1899,
    currency: 'INR',
    discountPercent: 40,
    // optional MRP for comparison
    mrp: 3165, // example MRP that makes ~40% off -> adjust to your real MRP
    sku: 'YOU-08-1KG',
    gtin: '8900000000008', // optional; set your actual GTIN if available
    availability: 'https://schema.org/InStock',
    ratingValue: 4.8, // if you have reviews
    ratingCount: 154, // set to your real count
    category: 'Nutrition > Sports Nutrition > Protein',
  };

  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  ngOnInit(): void {
    // --------- <title> & essential meta ---------
    const pageTitle = `${this.product.name} | 40% Off – Only ₹${this.product.price} | ekScoop India`;
    const description =
      `Grab ${this.product.name} at ${this.product.discountPercent}% OFF – now just ₹${this.product.price}. ` +
      `Clean, high-quality plant protein with great mixability and easy digestion. Free, fast delivery across India.`;
    const keywords = [
      'plant protein',
      'vegan protein powder',
      'ekScoop YOU x 0.8',
      'YOU 0.8 protein',
      'best plant protein India',
      'lactose free protein',
      'unflavoured protein',
      '40% off protein',
      '₹1899 protein deal',
      'ekScoop'
    ].join(', ');

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });

    // indexable product page
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    // --------- Canonical ---------
    const existingCanon = this.doc.querySelector("link[rel='canonical']");
    const link = existingCanon ?? this.doc.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', this.product.url);
    if (!existingCanon) this.doc.head.appendChild(link);

    // --------- Open Graph (Facebook/LinkedIn/WhatsApp) ---------
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: this.product.url });
    this.meta.updateTag({ property: 'og:image', content: this.product.image });
    this.meta.updateTag({ property: 'product:price:amount', content: String(this.product.price) });
    this.meta.updateTag({ property: 'product:price:currency', content: this.product.currency });
    this.meta.updateTag({ property: 'product:availability', content: 'in stock' });

    // --------- Twitter Card ---------
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: this.product.image });

    // --------- JSON-LD Structured Data ---------
    this.injectJsonLd(this.buildProductSchema());
    this.injectJsonLd(this.buildBreadcrumbSchema());
    this.injectJsonLd(this.buildFaqSchema());
  }

  // Inject a <script type="application/ld+json"> to <head>
  private injectJsonLd(schemaObj: unknown) {
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaObj);
    this.doc.head.appendChild(script);
  }

  // Product + Offer schema for rich results
  private buildProductSchema() {
    const offer = {
      "@type": "Offer",
      "url": this.product.url,
      "priceCurrency": this.product.currency,
      "price": String(this.product.price),
      "availability": this.product.availability,
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "ekScoop"
      }
    };
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": this.product.name,
      "image": [ this.product.image ],
      "description": "High-quality plant protein with clean profile, great mixability, and easy digestion. Limited-time 40% OFF – only ₹" + this.product.price + ".",
      "sku": this.product.sku,
      ...(this.product.gtin ? { "gtin13": this.product.gtin } : {}),
      "brand": { "@type": "Brand", "name": this.product.brand },
      "category": this.product.category,
      "offers": offer,
      ...(this.product.ratingCount > 0 ? {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": String(this.product.ratingValue),
          "reviewCount": String(this.product.ratingCount)
        }
      } : {})
    };
  }

  // Breadcrumbs for context
  private buildBreadcrumbSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.ekscoop.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Products",
          "item": "https://www.ekscoop.com/products"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": this.product.name,
          "item": this.product.url
        }
      ]
    };
  }

  // FAQ – helps win more SERP real estate
  private buildFaqSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is ekScoop YOU x 0.8 Plant Protein?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A clean, high-quality plant protein blend designed for daily use with great mixability and easy digestion, suitable for veg and lactose-free lifestyles."
          }
        },
        {
          "@type": "Question",
          "name": "What is the current price and discount?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Limited-time launch offer: " + this.product.discountPercent + "% OFF. Pay only ₹" + this.product.price + " (inclusive of taxes)."
          }
        },
        {
          "@type": "Question",
          "name": "Do you offer fast delivery across India?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, we ship pan-India with free, fast delivery on this launch offer."
          }
        },
        {
          "@type": "Question",
          "name": "Is it easy to digest and mix?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. YOU x 0.8 is formulated for smooth mixability and light digestion when used as directed."
          }
        }
      ]
    };
  }
}
