import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-partner-benefits',
  imports:[CommonModule],
  standalone: true,
  templateUrl: './partner-benefits.component.html',
  styleUrls: ['./partner-benefits.component.css']
})
export class PartnerBenefitsComponent {
  benefits = [
    {
      icon: 'assets/icons/commission.svg',
      title: 'Zero Commission Fees',
      subtitle: 'Keep 100% of your sales - no hidden charges or commission cuts',
      bullets: [
        'No commission on sales',
        'No listing fees',
        'No monthly subscriptions',
        'All profits stay with you'
      ]
    },
    {
      icon: 'assets/icons/customers.svg',
      title: 'Reach Local Customers',
      subtitle: 'Customers within 2km radius can discover your store instantly',
      bullets: [
        'Hyper-local discovery',
        'Targeted customer base',
        'Higher conversion rates',
        'Repeat customers'
      ]
    },
    {
      icon: 'assets/icons/whatsapp.svg',
      title: 'Direct WhatsApp Orders',
      subtitle: 'Customers contact you directly – you control the entire process',
      bullets: [
        'Direct communication',
        'Build customer relationships',
        'Flexible ordering',
        'Personal service'
      ]
    },
    {
      icon: 'assets/icons/lightning.svg',
      title: 'Simple Store Listing',
      subtitle: 'Just provide your store details – we handle the online visibility',
      bullets: [
        'Easy setup process',
        'No technical knowledge needed',
        'Instant online presence',
        'Free store profile'
      ]
    },
    {
      icon: 'assets/icons/growth.svg',
      title: 'Sell More Products',
      subtitle: 'Customers ordering protein often buy groceries too – increase basket size',
      bullets: [
        'Cross-selling opportunities',
        'Larger order values',
        'Regular customers',
        'Business growth'
      ]
    },
    {
      icon: 'assets/icons/control.svg',
      title: 'You Stay In Control',
      subtitle: 'Manage delivery, pricing, and customer service your way',
      bullets: [
        'Set your own prices',
        'Choose delivery method',
        'Handle payments directly',
        'Build your brand'
      ]
    }
  ];
}
