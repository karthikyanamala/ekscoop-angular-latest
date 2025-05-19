import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grid-carousel',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './image-carousel.component.html',
  styleUrls: ['./image-carousel.component.css']
})
export class GridCarouselComponent {
  // Image paths to be displayed in grid
  allImages = [
    '/assets/images/1.png',
    '/assets/images/our-story-root-family.png',
    '/assets/images/2.png',
    '/assets/images/3.png',
    '/assets/images/4.png',
    '/assets/images/5.png',
    '/assets/images/6.png',
    '/assets/images/7.png',
    '/assets/images/8.png',
    '/assets/images/9.png',
    '/assets/images/10.png',
    '/assets/images/11.png',
    '/assets/images/13.png',
    '/assets/images/14.png',
    '/assets/images/15.png',
    '/assets/images/16.png'
  ];
 currentIndex: number = 0;
  intervalId: any;
  isPaused: boolean = false;

  ngOnInit(): void {
    this.startAutoRotate();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  startAutoRotate(): void {
    this.intervalId = setInterval(() => {
      if (!this.isPaused) {
        this.next();
      }
    }, 2000); // Change image every 2 seconds
  }

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.allImages.length;
  }

  previous(): void {
    this.currentIndex = (this.currentIndex - 1 + this.allImages.length) % this.allImages.length;
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  // Always return 4 images for display, wrapping around if needed
  get visibleImages(): string[] {
    const result: string[] = [];
    for (let i = 0; i < 4; i++) {
      const index = (this.currentIndex + i) % this.allImages.length;
      result.push(this.allImages[index]);
    }
    return result;
  }
}