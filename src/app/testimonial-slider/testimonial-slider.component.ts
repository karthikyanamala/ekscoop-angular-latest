// testimonial-slider.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-testimonial-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonial-slider.component.html',
  styleUrls: ['./testimonial-slider.component.css']
})
export class TestimonialSliderComponent {
  currentIndex = 0;
  intervalId: any;
  isPaused = false;

  testimonials = [
    {
      name: 'Lisa Redfern',
      photo: '/assets/testimonials.png',
      quote: 'This product is amazing. I mix it in my meals every day!',
      profession: 'Dietician',
      rating: 5
    },
    {
      name: 'Arjun Patel',
      photo: '/assets/images/arjun.jpg',
      quote: 'Great for diabetic patients. Neutral taste, big benefit.',
      profession: 'Nutritionist',
      rating: 5
    },
    {
      name: 'Riya Singh',
      photo: '/assets/images/riya.jpg',
      quote: 'My daughter eats dal again — thanks to ekScoop!',
      profession: 'Mom & Engineer',
      rating: 4
    },
      {
      name: 'Ramya',
      photo: '/assets/images/riya.jpg',
      quote: 'My daughter eats dal again — thanks to ekScoop!',
      profession: 'Mom & Engineer',
      rating: 4
    },
      {
      name: 'Nisha Singh',
      photo: '/assets/images/riya.jpg',
      quote: 'My daughter eats dal again — thanks to ekScoop!',
      profession: 'Mom & Engineer',
      rating: 4
    }
  ];

  ngOnInit(): void {
    this.startAutoRotate();
  }

  ngOnDestroy(): void {
    this.stopAutoRotate();
  }

  startAutoRotate(): void {
    this.intervalId = setInterval(() => {
      if (!this.isPaused) {
        this.next();
      }
    }, 5000); // rotate every 5 seconds
  }

  stopAutoRotate(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
  }

  prev(): void {
    this.currentIndex =
      (this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length;
  }

  getCurrent() {
    return this.testimonials[this.currentIndex];
  }
  
}