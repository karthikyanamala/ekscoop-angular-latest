// src/app/pages/lab-reports-page/lab-reports-page.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-lab-reports-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lab-reports-page.component.html',
  styleUrls: ['./lab-reports-page.component.css']
})
export class LabReportsPageComponent {
  schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "ekScoop YOU x 0.8 Protein Lab Reports",
    "description": "View verified third-party lab reports for ekScoop YOU x 0.8 plant protein powder. Transparency, safety, and purity tested for trust.",
    "publisher": {
      "@type": "Organization",
      "name": "ekScoop",
      "url": "https://www.ekscoop.com",
      "logo": "https://www.ekscoop.com/assets/favicon/android-chrome-192x192.png"
    },
    "mainEntity": {
      "@type": "Product",
      "name": "YOU x 0.8 Plant Protein Powder",
      "brand": "ekScoop",
      "description": "Unflavoured, diabetic-friendly, vegan plant protein powder, verified with third-party lab tests for purity and safety.",
      "url": "https://www.ekscoop.com/products/youx0.8",
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "price": "1899",
        "availability": "https://schema.org/InStock",
        "url": "https://www.ekscoop.com/products/youx0.8"
      }
    }
  });

  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private doc: Document
  ) {
    const pageTitle = "Lab Reports | ekScoop YOU x 0.8 Plant Protein – Verified Safety & Purity";
    const description =
      "Transparency first: Access third-party verified lab test reports of ekScoop YOU x 0.8 plant protein. 100% authentic, safe, and unflavoured protein with no hidden chemicals.";
    const keywords = [
      "lab reports protein powder",
      "third party tested protein India",
      "ekScoop YOU x 0.8 protein lab results",
      "transparent protein brand India",
      "safe protein supplement",
      "authentic protein lab tested",
      "unflavoured vegan protein powder India"
    ].join(", ");

    // --- SEO meta ---
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: "description", content: description });
    this.meta.updateTag({ name: "keywords", content: keywords });

    // Open Graph
    this.meta.updateTag({ property: "og:title", content: pageTitle });
    this.meta.updateTag({ property: "og:description", content: description });
    this.meta.updateTag({ property: "og:type", content: "website" });
    this.meta.updateTag({ property: "og:url", content: "https://www.ekscoop.com/lab-reports" });
    this.meta.updateTag({ property: "og:image", content: "https://www.ekscoop.com/assets/lab-reports-og.jpg" });

    // Twitter
    this.meta.updateTag({ name: "twitter:card", content: "summary_large_image" });
    this.meta.updateTag({ name: "twitter:title", content: pageTitle });
    this.meta.updateTag({ name: "twitter:description", content: description });
    this.meta.updateTag({ name: "twitter:image", content: "https://www.ekscoop.com/assets/lab-reports-og.jpg" });

    // Canonical
    const existing = this.doc.querySelector("link[rel='canonical']");
    const link = existing ?? this.doc.createElement("link");
    link.setAttribute("rel", "canonical");
    link.setAttribute("href", "https://www.ekscoop.com/lab-reports");
    if (!existing) this.doc.head.appendChild(link);

    // Noindex/nofollow is NOT used here (unlike cashback) → this page should rank
  }
}
