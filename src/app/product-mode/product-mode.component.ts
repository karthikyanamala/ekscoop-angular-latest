import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-mode',
  imports:[CommonModule],
  templateUrl: './product-mode.component.html',
  styleUrls: ['./product-mode.component.css'],
  animations: [
    trigger('fadeZoom', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ]
})
export class ProductModeComponent {
  modes = ['Family', 'Feminine', 'Gym', 'Health'];
  activeMode = 'Family';

  getImage(mode: string): string {
    return `assets/${mode.toLowerCase()}-mode.png`;
  }

  getDescription(mode: string): string {
    const desc: Record<string, string> = {
      Family: 'A nutritional supplement suitable for the entire family. Designed to meet the general health needs of all family members.',
      Feminine: 'Tailored for women’s nutritional needs. Supports strength, energy, and hormonal balance.',
      Gym: 'High-protein support designed for workouts and recovery. Aids muscle repair and stamina.',
      Health: 'Clean daily protein for immunity, energy, and healthy living. Made for everyone.'
    };
    return desc[mode];
  }

  setMode(mode: string) {
    this.activeMode = mode;
  }
}
