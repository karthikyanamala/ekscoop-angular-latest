import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-trust-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trust-section.component.html',
  styleUrls: ['./trust-section.component.css']
})
export class TrustSectionComponent {
  trustFeatures: { icon: SafeHtml; title: string; description: string }[] = [];

  constructor(private sanitizer: DomSanitizer) {
    this.trustFeatures = [
      {
        icon: this.sanitizer.bypassSecurityTrustHtml(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>`),
        title: 'Quality Assured',
        description: 'Made with ❤️ in India with the highest quality standards',
      },
      {
        icon: this.sanitizer.bypassSecurityTrustHtml(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="6"/>
            <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"/>
          </svg>`),
        title: 'Certified',
        description: 'Vegan, diabetic-friendly, and nutritionally balanced',
      },
      {
        icon: this.sanitizer.bypassSecurityTrustHtml(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>`),
        title: '10,000+ Happy Customers',
        description: 'Trusted by families across India for daily nutrition',
      },
      {
        icon: this.sanitizer.bypassSecurityTrustHtml(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" viewBox="0 0 24 24">
            <rect x="1" y="3" width="15" height="13"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>`),
        title: 'Fast Delivery',
        description: 'Free shipping on all orders, delivered fresh to your door',
      }
    ];
  }
  scrollToProduct() {
  const el = document.getElementById('product-showcase');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

}
