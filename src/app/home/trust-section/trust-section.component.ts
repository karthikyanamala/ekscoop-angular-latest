import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
interface TrustFeature {
  icon: string; // Lucide icon name or path to local SVG
  title: string;
  description: string;
}

@Component({
  selector: 'app-trust-section',
  imports:[CommonModule],
  templateUrl: './trust-section.component.html',
  styleUrls: ['./trust-section.component.css']
})
export class TrustSectionComponent {
  trustFeatures: TrustFeature[] = [
    {
      icon: 'shield',
      title: 'Quality Assured',
      description: 'Made with ❤️ in India with the highest quality standards',
    },
    {
      icon: 'award',
      title: 'Certified',
      description: 'Vegan, diabetic-friendly, and nutritionally balanced',
    },
    {
      icon: 'users',
      title: '10,000+ Happy Customers',
      description: 'Trusted by families across India for daily nutrition',
    },
    {
      icon: 'truck',
      title: 'Fast Delivery',
      description: 'Free shipping on all orders, delivered fresh to your door',
    }
  ];
}
