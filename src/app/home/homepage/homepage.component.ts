import { Component } from '@angular/core';
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
  imports: [ HeroComponent,CornerBadgeComponent,MealSectionComponent,TrustSectionComponent,FooterComponent,FeaturesComponent,ProductShowcaseComponent,ShoppingPlatformsComponent,CommonModule,],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent {

}
