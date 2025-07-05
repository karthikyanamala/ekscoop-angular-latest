import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-shopping-platforms',
  imports:[CommonModule],
  templateUrl: './shopping-platforms.component.html',
  styleUrls: ['./shopping-platforms.component.css']
})
export class ShoppingPlatformsComponent {
  platforms = [
    { name: 'Amazon', logo: '🛒', bg: '#ffe0b2' },
    { name: 'Flipkart', logo: '🛍️', bg: '#bbdefb' },
    { name: 'Blinkit', logo: '⚡', bg: '#fff9c4' },
    { name: 'Zepto', logo: '🚀', bg: '#e1bee7' },
  ];
}
