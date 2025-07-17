import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { RetailerBenefitsComponent } from '../retailer-benefits/retailer-benefits.component';
import { CornerBadgeComponent } from '../../corner-badge/corner-badge.component';
import { PartnerBenefitsComponent } from '../partner-benefits/partner-benefits.component';
import { TestimonialCarouselComponent } from '../testimonial-carousel/testimonial-carousel.component';
import { JoinBannerComponent } from '../join-banner/join-banner.component';
import { SimpleProcessComponent } from '../simple-process/simple-process.component';
import { PlatformCompareComponent } from '../platform-compare/platform-compare.component';
import { ContactUsComponent } from '../contact-us/contact-us.component';
import { FooterComponent } from '../../footer/footer.component';

@Component({
  selector: 'app-partner-with-us',
  standalone: true,
  imports: [
    HeroSectionComponent,
    ContactUsComponent,
    FooterComponent,
    RetailerBenefitsComponent,
    CornerBadgeComponent,
    PlatformCompareComponent,
    SimpleProcessComponent,
    PartnerBenefitsComponent,
    JoinBannerComponent,
    TestimonialCarouselComponent
  ],
  templateUrl: './partner-with-us.component.html',
  styleUrl: './partner-with-us.component.css'
})
export class PartnerWithUsComponent implements OnInit {
  @ViewChild('contactSection', { static: false }) contactSection!: ElementRef;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(
      'Partner with ekScoop | Resell YOU x 0.8 Plant Protein in Your Store'
    );

    this.metaService.addTags([
      {
        name: 'description',
        content:
          'Partner with ekScoop to sell YOU x 0.8 — a clean, unflavoured plant protein designed for Indian households. Join as a retailer, nutritionist, doctor, or wellness promoter.'
      },
      {
        name: 'keywords',
        content:
          'partner with protein brand, sell plant protein, resell protein powder India, protein brand for Indian stores, join ekScoop partnership, fitness supplement reseller, earn with health products, protein for pharmacies, ayurvedic doctors, nutrition influencers'
      },
      {
        property: 'og:title',
        content: 'Become an ekScoop Partner | Sell Clean Protein Locally'
      },
      {
        property: 'og:description',
        content:
          'Help families discover YOU x 0.8 protein by joining our retail and health partner network. Local focus. Zero commission model. Full support.'
      },
      {
        property: 'og:url',
        content: 'https://www.ekscoop.com/partner-with-us'
      },
      {
        name: 'robots',
        content: 'index, follow'
      }
    ]);

    // Inject canonical link
    const canonical = this.document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', 'https://www.ekscoop.com/partner-with-us');
    this.document.head.appendChild(canonical);
  }

  scrollToContact() {
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
