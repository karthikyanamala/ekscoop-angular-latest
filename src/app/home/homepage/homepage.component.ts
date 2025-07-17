import { Component, OnInit, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { FeaturesComponent } from '../features/features.component';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../hero/hero.component';
import { MealSectionComponent } from '../meal-section/meal-section.component';
import { ProductShowcaseComponent } from '../product-showcase/product-showcase.component';
import { ShoppingPlatformsComponent } from '../shopping-platforms/shopping-platforms.component';
import { TrustSectionComponent } from '../trust-section/trust-section.component';
import { CornerBadgeComponent } from '../../corner-badge/corner-badge.component';
import { FooterComponent } from '../../footer/footer.component';
import { DOCUMENT } from '@angular/common';

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
    ShoppingPlatformsComponent,
    CommonModule,
  ],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  ngOnInit(): void {
    const title = 'Plant Protein Powder for Indian Meals | Unflavoured | ekScoop';
    const description = 'Buy YOU x 0.8 – an unflavoured plant protein made for Indian families. Mix easily with roti, dal, poha or curd. Zero taste. Full strength. Diabetic-friendly. Lactose-free. Gluten-free.';
    const imageUrl = 'https://www.ekscoop.com/assets/images/og-protein-banner.jpg';
    const pageUrl = 'https://www.ekscoop.com/';

    // Set title
    this.titleService.setTitle(title);

    // Canonical tag (avoids duplicate content issues)
    const link: HTMLLinkElement = this.doc.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', pageUrl);
    this.doc.head.appendChild(link);

    // Clear and set meta tags properly
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({
      name: 'keywords',
      content:
        'plant protein India, unflavoured protein powder, protein for roti, dal protein supplement, vegan protein Indian food, protein for gym, protein for Indian homes, gym protein without flavour, lactose-free protein, protein for Indian men and women, healthy muscle food, muscle gain with Indian meals, YOU x 0.8, ekScoop protein, gym supplement for vegetarians, gym supplement for Indians'
    });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });

    // Open Graph
    this.metaService.updateTag({ property: 'og:title', content: 'YOU x 0.8 – Unflavoured Plant Protein for Indian Meals' });
    this.metaService.updateTag({ property: 'og:description', content: 'Add extra protein to your roti, dal, poha or curd with YOU x 0.8. Indian-designed, plant-based, tasteless, and easy to mix.' });
    this.metaService.updateTag({ property: 'og:image', content: imageUrl });
    this.metaService.updateTag({ property: 'og:url', content: pageUrl });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });

    // Twitter meta
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: imageUrl });
  }
}
