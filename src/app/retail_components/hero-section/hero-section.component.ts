import { Component } from '@angular/core';

@Component({
  selector: 'app-hero-section',
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css']
})
export class HeroSectionComponent {
   scrollToContact() {
    const target = document.getElementById('contact');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }
   scrollToSimpleProcess() {
    const target = document.getElementById('simpleprocess');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
