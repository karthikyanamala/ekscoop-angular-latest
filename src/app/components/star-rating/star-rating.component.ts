import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [NgFor],
  template: `
    <div class="stars" role="radiogroup" aria-label="Rating" [class.readonly]="readonly">
      <button
        type="button"
        *ngFor="let _ of stars; let i = index"
        class="star-btn"
        [class.filled]="(i + 1) <= current()"
        [attr.aria-checked]="(i + 1) === current()"
        [attr.aria-label]="(i + 1) + ' star'"
        role="radio"
        (mouseenter)="hover(i + 1)"
        (mouseleave)="hover(0)"
        (click)="rate(i + 1)"
        (keydown.enter)="rate(i + 1)"
        (keydown.space)="rate(i + 1)"
        [disabled]="readonly">
        ★
      </button>
    </div>
  `,
styles: [`
  .stars{display:inline-flex;gap:6px}
  .stars.readonly{pointer-events:none}
  .star-btn{
    width:28px;height:28px;line-height:28px;font-size:22px;
    border:none;background:transparent;cursor:pointer;
    color:hsl(0 0% 85%);padding:0;border-radius:6px;outline:none;
    transition:transform .06s, color .12s, filter .12s;
  }
  .star-btn.filled{color:var(--brand, hsl(16 100% 60%))}
  .stars:not(.readonly) .star-btn:hover{transform:translateY(-1px)}
  .star-btn:active{transform:translateY(0)}
  .star-btn:disabled{cursor:default}
  @media (max-width:480px){ .star-btn{width:24px;height:24px;font-size:20px} }
`]


})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() max = 5;
  @Input() readonly = false;
  @Output() ratingChange = new EventEmitter<number>();

  private hoverValue = signal(0);

  get stars() { return Array.from({ length: this.max }); }
  current() { return this.hoverValue() || this.rating; }

  hover(v: number) { if (!this.readonly) this.hoverValue.set(v); }
  rate(v: number) {
    if (this.readonly) return;
    this.rating = v;
    this.hoverValue.set(0);
    this.ratingChange.emit(v);
  }
}
