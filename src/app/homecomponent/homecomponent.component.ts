import { Component } from '@angular/core';
import { HerosectionComponent } from '../hero-section/hero-section.component';
import { AboutproductComponent } from '../about-products/about-products.component';
import { HowitworksComponent } from '../how-it-works/how-it-works.component';
import { ForshopownersComponent } from '../for-shop-owners/for-shop-owners.component';
import { WhyproteinmattersComponent } from '../why-protien-matters/why-protien-matters.component';
import {CornerBadgeComponent} from "../corner-badge/corner-badge.component"
import {FooterComponent} from "../footer/footer.component"
import { TestimonialSliderComponent } from '../testimonial-slider/testimonial-slider.component';
import { PosterFlipGridComponent } from '../flip-poster-card/flip-poster-card.component';
import { GridCarouselComponent } from '../image-carousel/image-carousel.component';
 @Component({
  selector: 'app-homecomponent',
  standalone:true,
  imports: [ HerosectionComponent,
    AboutproductComponent,
    HowitworksComponent,
    ForshopownersComponent,
    WhyproteinmattersComponent,
    CornerBadgeComponent,FooterComponent,TestimonialSliderComponent,PosterFlipGridComponent,GridCarouselComponent],
  templateUrl: './homecomponent.component.html',
  styleUrl: './homecomponent.component.css'
})
export class HomecomponentComponent {

}
