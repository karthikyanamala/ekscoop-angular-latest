
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HomeContentService } from '../services/homeservices';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  standalone: true,
  selector: 'app-how-it-works',
  imports: [CommonModule],
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.css']
})
export class HowitworksComponent implements OnInit, AfterViewInit {
  data: any;

  constructor(private contentService: HomeContentService) {}

  ngOnInit(): void {
    this.contentService.getHowItWorks().subscribe((data) => {
      this.data = data;

      // Delay the animation to allow Angular to render the DOM
      setTimeout(() => {
        this.initScrollAnimations();
      }, 100);
    });
  }

  ngAfterViewInit(): void {
    // Could also use MutationObserver here if needed
  }
  initScrollAnimations(): void {
    const cards = document.querySelectorAll('.how-it-works-card');
  
    cards.forEach((card, i) => {
      const computedStyle = window.getComputedStyle(card);
      const transform = computedStyle.transform;
  
      let rotation = 0;
  
      // Extract rotation in degrees from matrix
      if (transform && transform !== 'none') {
        const values = transform
          .split('(')[1]
          .split(')')[0]
          .split(',');
        const a = parseFloat(values[0]);
        const b = parseFloat(values[1]);
        rotation = Math.round(Math.atan2(b, a) * (180 / Math.PI));
      }
  
      gsap.fromTo(
        card,
        {
          y: 0,
          rotate: rotation, // Preserve original rotation
        },
        {
          scrollTrigger: {
            trigger: card,
            start: '',
            scrub: true,
          },
          y: -i * 50,
          rotate: rotation, // Maintain rotation during scroll
          ease: 'none',
        }
      );
    });
  }
  
}
