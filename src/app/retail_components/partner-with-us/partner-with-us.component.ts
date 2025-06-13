import { Component,ElementRef, ViewChild } from '@angular/core';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { RetailerBenefitsComponent } from '../retailer-benefits/retailer-benefits.component';
import { CornerBadgeComponent } from '../../corner-badge/corner-badge.component';
import { PartnerBenefitsComponent } from '../partner-benefits/partner-benefits.component';
import { TestimonialCarouselComponent } from '../testimonial-carousel/testimonial-carousel.component';
import { JoinBannerComponent } from '../join-banner/join-banner.component';
import { SimpleProcessComponent } from '../simple-process/simple-process.component';
import { PlatformCompareComponent } from '../platform-compare/platform-compare.component';
import { ContactUsComponent } from '../contact-us/contact-us.component';
@Component({
  selector: 'app-partner-with-us',
  standalone: true,
  imports: [HeroSectionComponent,ContactUsComponent,RetailerBenefitsComponent,CornerBadgeComponent,PlatformCompareComponent,SimpleProcessComponent,PartnerBenefitsComponent,JoinBannerComponent,TestimonialCarouselComponent],
  templateUrl: './partner-with-us.component.html',
  styleUrl: './partner-with-us.component.css'
})
export class PartnerWithUsComponent {
    @ViewChild('contactSection', { static: false }) contactSection!: ElementRef;

  scrollToContact() {
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
