import { Component, OnInit } from '@angular/core';
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
  constructor(private titleService: Title, private metaService: Meta) {}

  ngOnInit(): void {
    // Set SEO title
    this.titleService.setTitle(
      'Plant Protein Powder for Indian Meals | Unflavoured | ekScoop'
    );

    // Set core meta description
    this.metaService.addTags([
      {
        name: 'description',
        content:
          'Buy YOU x 0.8 – an unflavoured plant protein made for Indian families. Mix easily with roti, dal, poha or curd. Zero taste. Full strength. Diabetic-friendly. Lactose-free. Gluten-free.'
      },
      {
        name: 'keywords',
        content:
          'plant protein India, unflavoured protein powder, protein for roti, dal protein supplement, vegan protein Indian food, protein for gym, protein for Indian homes, gym protein without flavour, lactose-free protein, protein for Indian men and women, healthy muscle food, muscle gain with Indian meals, YOU x 0.8, ekScoop protein, gym supplement for vegetarians, gym supplement for Indians'
      },
      {
        property: 'og:title',
        content: 'YOU x 0.8 – Unflavoured Plant Protein for Indian Meals'
      },
      {
        property: 'og:description',
        content:
          'Add extra protein to your roti, dal, poha or curd with YOU x 0.8. Indian-designed, plant-based, tasteless, and easy to mix.'
      },
      {
        property: 'og:image',
        content: 'https://www.ekscoop.com/assets/images/og-protein-banner.jpg' // Replace with actual path
      },
      {
        property: 'og:url',
        content: 'https://www.ekscoop.com/'
      },
      {
        name: 'robots',
        content: 'index, follow'
      }
    ]);
  }
}
