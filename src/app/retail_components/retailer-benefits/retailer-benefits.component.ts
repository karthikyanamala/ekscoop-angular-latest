import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-retailer-benefits',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './retailer-benefits.component.html',
  styleUrls: ['./retailer-benefits.component.css']
})
export class RetailerBenefitsComponent {
  benefits = [
    {
      icon: '📍',
      title: '2km',
      subtitle: 'radius coverage ensures customers find your store',
      note: 'Hyper-local discovery advantage'
    },
    {
      icon: '👥',
      title: '85%',
      subtitle: 'of customers prefer buying from local stores',
      note: 'When they can find them easily'
    },
    {
      icon: '📈',
      title: '300%',
      subtitle: 'increase in sales for our partner stores',
      note: 'More products sold per customer'
    },
    {
      icon: '⏰',
      title: '24/7',
      subtitle: 'your store is visible to customers online',
      note: 'Even when physically closed'
    }
  ];
}
