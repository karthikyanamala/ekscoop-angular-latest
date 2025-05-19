import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-poster-final',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-showcase.component.html',
  styleUrls: ['./product-showcase.component.css']
})
export class PosterFinalComponent {
  sections = [
    {
      meal: 'Breakfast',
      food: 'Poha',
      sachet: '/assets/poster-sections/Retail.png',
      foodImg: '/assets/poster-sections/Poha1.png',
      bgClass: 'sunrise',
      icons: ['sun', 'leaves'],
       leftTips: [
        'Mix YOU x 0.8 into curd just before eating.',
        'Best with rice or as bedtime protein.'
      ],
      rightTips: [
        'Easy digestion, supports overnight recovery.',
        'Gentle on stomach, strong on nutrition.'
      ]
    },
    {
      meal: 'Lunch',
      food: 'Dal',
      sachet: '/assets/poster-sections/Gym1.png',
      foodImg: '/assets/poster-sections/Dal1.png',
      bgClass: 'noon',
      icons: ['leaves', 'wheat'],
       leftTips: [
        'Mix YOU x 0.8 into curd just before eating.',
        'Best with rice or as bedtime protein.'
      ],
      rightTips: [
        'Easy digestion, supports overnight recovery.',
        'Gentle on stomach, strong on nutrition.'
      ]
    },
    {
      meal: 'Snack',
      food: 'Roti',
      sachet: '/assets/poster-sections/WomenP.png',
      foodImg: '/assets/poster-sections/Pasta1.png',
      bgClass: 'sunset',
      icons: ['cloud', 'leaves'],
       leftTips: [
        'Mix YOU x 0.8 into curd just before eating.',
        'Best with rice or as bedtime protein.'
      ],
      rightTips: [
        'Easy digestion, supports overnight recovery.',
        'Gentle on stomach, strong on nutrition.'
      ]
    },
    {
      meal: 'Dinner',
      food: 'Curd',
      sachet: '/assets/poster-sections/Pharmacy.png',
      foodImg: '/assets/poster-sections/Roti1.png',
      bgClass: 'night',
      icons: ['moon', 'stars'],
       leftTips: [
        'Mix YOU x 0.8 into curd just before eating.',
        'Best with rice or as bedtime protein.'
      ],
      rightTips: [
        'Easy digestion, supports overnight recovery.',
        'Gentle on stomach, strong on nutrition.'
      ]
    }
  ];
}
