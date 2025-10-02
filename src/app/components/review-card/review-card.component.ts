import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { Review } from '../../model/review.model';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [CommonModule, StarRatingComponent],
  template: `
  <article class="card">
    <header class="head">
      <div class="who">
        <h3>{{review.name}}</h3>
        <p class="date">{{ date }}</p>
      </div>
      <app-star-rating [rating]="review.rating" [readonly]="true"></app-star-rating>
    </header>
    <p class="text">{{review.text}}</p>
  </article>
  `,
 styles: [`
  .card{
    border:1px solid hsl(var(--border));
    border-radius:18px;
    padding:18px;
    background:#fff;
    box-shadow:0 6px 20px rgba(16,24,40,.04), 0 1px 0 rgba(16,24,40,.03);
    transition:box-shadow .2s, transform .08s;
  }
  .card:hover{box-shadow:0 12px 28px rgba(16,24,40,.10); transform:translateY(-1px)}
  .head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin:0 0 8px}
  .who h3{margin:0;font-size:1.02rem;font-weight:800}
  .date{margin:2px 0 0;color:hsl(var(--muted-foreground));font-size:.9rem}
  app-star-rating .star-btn{font-size:20px}
  .text{margin:4px 0 0;line-height:1.6}
`]

})
export class ReviewCardComponent {
  @Input() review!: Review;

  get date() {
    const v = (this.review as any)?.createdAt;
    const d: Date = v?.toDate ? v.toDate() : v instanceof Date ? v : new Date();
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
