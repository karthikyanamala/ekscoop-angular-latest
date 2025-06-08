import { Component } from '@angular/core';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { AboutproductComponent } from '../about-products/about-products.component';
import { HowitworksComponent } from '../how-it-works/how-it-works.component';
import { ForshopownersComponent } from '../for-shop-owners/for-shop-owners.component';
import { WhyproteinmattersComponent } from '../why-protien-matters/why-protien-matters.component';
import {CornerBadgeComponent} from "../corner-badge/corner-badge.component"
import {FooterComponent} from "../footer/footer.component"
import { TestimonialsComponent } from '../testimonial-slider/testimonial-slider.component';
import { ImageCarouselComponent } from '../image-carousel/image-carousel.component';
import { ProductShowcaseComponent } from '../product-showcase/product-showcase.component';
 @Component({
  selector: 'app-homecomponent',
  standalone:true,
  imports: [ HeroSectionComponent,
    AboutproductComponent,
    HowitworksComponent,
    ForshopownersComponent,
    WhyproteinmattersComponent,
    CornerBadgeComponent,FooterComponent,TestimonialsComponent,ImageCarouselComponent,ProductShowcaseComponent],
  templateUrl: './homecomponent.component.html',
  styleUrl: './homecomponent.component.css'
})
export class HomecomponentComponent {

}
