import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-poster-flip-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flip-poster-card.component.html',
  styleUrls: ['./flip-poster-card.component.css']
})
export class PosterFlipGridComponent {
  posters = [
    { image: '/assets/images/poha.png', title: 'Add to Poha', tip: 'Mix one scoop into atta before kneading.' },
    { image: '/assets/images/WomenPower2.png', title: 'Add to Roti', tip: 'Stir into hot dal before serving.' },
    { image: '/assets/images/Doctor.png', title: 'Blend with any food', tip: 'Mix after poha is ready.' },
    { image: '/assets/images/gym.png', title: 'Add to eve snacks', tip: 'Whisk into curd or chaas.' }
  ];

  hoverStates: boolean[] = this.posters.map(() => false);

  simulateHover(index: number) {
    this.hoverStates = this.posters.map(() => false);
    this.hoverStates[index] = true;
  }
}
