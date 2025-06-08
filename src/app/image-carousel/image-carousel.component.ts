import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-image-carousel',
  imports:[CommonModule],
  templateUrl: './image-carousel.component.html',
  styleUrls: ['./image-carousel.component.css']
})
export class ImageCarouselComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  isPlaying = true;
  intervalId: any;

  slides = [
    {
      title: 'Happy glucose, happy day.',
      subtitle: 'Simple Nutrition. Mighty Impact.'
    },
    {
      title: 'Enjoy poha with protein.',
      subtitle: 'Feel Stronger Daily'
    },
    {
      title: 'Simple Nutrition. Mighty Impact.',
      subtitle: 'Feel Stronger Daily'
    },
    {
      title: 'Perfect for every meal',
      subtitle: 'Nutrition made simple'
    }
  ];

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  startAutoplay(): void {
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.nextSlide();
      }
    }, 4000);
  }

  togglePlay(): void {
    this.isPlaying = !this.isPlaying;
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }
}
