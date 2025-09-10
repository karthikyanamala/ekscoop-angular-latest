import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// If these are NOT standalone, import their MODULES instead (see notes below)
import { CornerBadgeComponent } from '../corner-badge/corner-badge.component';
import { FooterComponent } from '../footer/footer.component';

import { ProductShowcaseComponent } from '../home/product-showcase/product-showcase.component';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [
    CommonModule,
    CornerBadgeComponent,     // or CornerBadgeModule if not standalone
    FooterComponent,          // or FooterModule if not standalone
    ProductShowcaseComponent, // showcase is standalone (see next file)
  ],
  template: `
    <!-- If you have a global header, import and place it here -->
    <!-- <app-header></app-header> -->

    <app-corner-badge></app-corner-badge>

    <main class="product-wrap">
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
  `]
})
export class ProductPageComponent {}
