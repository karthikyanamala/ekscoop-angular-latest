import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';




@Component({
  selector: 'app-testimonials',
  imports:[CommonModule],
  templateUrl: './testimonial-slider.component.html',
  styleUrls: ['./testimonial-slider.component.css']
})
export class TestimonialsComponent implements OnInit {
   testimonials = [
    { name: 'Ramya', rating: 4, text: 'Amazing quality and taste!' },
    { name: 'Nisha Singh', title: 'Mom & Engineer', rating: 4, text: 'My daughter eats dal again — thanks to ekScoop!' },
    { name: 'Lisa Redfern', rating: 5, text: 'Perfect for my daily nutrition needs.' },
    { name: 'Amit Rao', title: 'Fitness Coach', rating: 5, text: 'Best local protein option available!' },
    { name: 'Sneha Patel', title: 'Home Cook', rating: 5, text: 'Feels light and easy on my stomach.' }
  ];

  currentIndex = 0;
  isPlaying = true;
  intervalId: any;

  ngOnInit() {
    this.startAutoplay();
  }

  startAutoplay() {
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.next();
      }
    }, 3000);
  }

  stopAutoplay() {
    clearInterval(this.intervalId);
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
  }

  prev() {
    this.currentIndex =
      (this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length;
  }

  goTo(index: number) {
    this.currentIndex = index;
  }

  getVisibleTestimonials() {
    if (window.innerWidth <= 768) return [this.testimonials[this.currentIndex]];

    const prev = this.testimonials[(this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length];
    const current = this.testimonials[this.currentIndex];
    const next = this.testimonials[(this.currentIndex + 1) % this.testimonials.length];
    return [prev, current, next];
  }
}