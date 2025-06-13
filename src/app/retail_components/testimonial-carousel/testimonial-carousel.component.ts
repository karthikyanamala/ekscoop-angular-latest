import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-testimonial-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonial-carousel.component.html',
  styleUrls: ['./testimonial-carousel.component.css'],
})
export class TestimonialCarouselComponent {
  testimonials = [
    {
      quote: `EkScoop brought so many new customers to my store. They come for protein and end up buying their weekly groceries. Best decision ever!`,
      name: 'Priya Sharma',
      store: 'Sharma General Store',
      city: 'Delhi',
      result: '60% more customers'
    },
    {
      quote: `I was skeptical at first, but EkScoop really works! Now I get WhatsApp orders daily and my monthly revenue increased by ₹25,000 without any commission cuts.`,
      name: 'Ahmed Khan',
      store: "Khan's Corner Shop",
      city: 'Bangalore',
      result: '₹25,000 extra monthly'
    },
    {
      quote: `Customers ordering protein always add more items. My average order value increased by 50%. EkScoop helps me compete with big online platforms!`,
      name: 'Sunita Reddy',
      store: "Reddy's Provision Store",
      city: 'Hyderabad',
      result: '50% larger order value'
    },
    {
      quote: `Since listing on EkScoop, my store sees more footfall and basket sizes have grown. And no commission fees at all.`,
      name: 'Raj Patel',
      store: "Fresh Mart Grocery Store",
      city: 'Mumbai',
      result: '40% increase in monthly sales'
    },
    {
      quote: `More orders, more profit. EkScoop is now a core part of my store’s growth strategy.`,
      name: 'Kavita Mehra',
      store: "Mehra Kirana",
      city: 'Chennai',
      result: '35% profit boost'
    }
  ];

  currentIndex = 0;
  visibleCards = 3;

  ngOnInit() {
    this.setVisibleCards(window.innerWidth);
    window.addEventListener('resize', this.handleResize);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    this.setVisibleCards(window.innerWidth);
  };

  setVisibleCards(width: number) {
    if (width <= 768) {
      this.visibleCards = 1;
    } else if (width <= 1024) {
      this.visibleCards = 2;
    } else {
      this.visibleCards = 3;
    }
  }

  next() {
    if (this.currentIndex < this.testimonials.length - this.visibleCards) {
      this.currentIndex++;
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  getTransform(): string {
    return `translateX(-${(this.currentIndex * (100 / this.visibleCards))}%)`;
  }
}
