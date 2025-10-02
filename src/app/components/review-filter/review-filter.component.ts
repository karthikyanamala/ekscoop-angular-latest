import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor } from '@angular/common';

export interface BreakdownItem { rating: number; count: number; percentage: number; }

@Component({
  selector: 'app-review-filter',
  standalone: true,
  imports: [NgFor],
  template: `
  <aside class="panel">
    <h4>Filter by Rating</h4>

    <button class="row" [class.active]="selectedRating===null" (click)="select(null)">
      <span>All Reviews</span><span class="count">{{total}}</span>
    </button>

    <button class="row" *ngFor="let b of breakdown" [class.active]="selectedRating===b.rating" (click)="select(b.rating)">
      <div class="left">
        <span class="star-num">{{b.rating}}</span>
        <span class="stars">★</span>
      </div>
      <div class="bar">
  <span class="bar-fill" [style.--w]="b.percentage + '%'"></span>
</div>

      <span class="meta">{{b.percentage}}% ({{b.count}})</span>
    </button>
  </aside>
  `,
  styles: [`
  .panel{
    border:1px solid hsl(var(--border));
    border-radius:20px;
    padding:18px;
    background:#fff;
    box-shadow:0 6px 20px rgba(16,24,40,.04), 0 1px 0 rgba(16,24,40,.03);
  }
  h4{margin:0 0 12px;font-size:1.05rem;font-weight:800}

  .row{
    width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;
    border:1px solid hsl(var(--border));background:#fff;border-radius:14px;
    padding:12px 14px;margin:10px 0;cursor:pointer;
    transition:border-color .15s, box-shadow .15s, transform .05s, background .2s;
  }
  .row:hover{box-shadow:0 4px 14px rgba(0,0,0,.05)}
  .row:active{transform:translateY(1px)}
  .row.active{
    background:hsl(16 100% 97%);border-color:hsl(16 100% 85%);
    box-shadow:0 4px 14px rgba(255,112,41,.12)
  }

  .left{display:flex;align-items:center;gap:8px}
  .star-num{font-weight:700}
  .stars{color:hsl(var(--primary))}

  .bar{flex:1;height:10px;background:hsl(210 40% 96.1%);border-radius:999px;overflow:hidden}
  .bar-fill{
    display:block;height:100%;
    background:linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(16 100% 55%) 60%);
    width:0;              /* start collapsed */
    transition:width .9s var(--ease);
    position:relative; overflow:hidden;
  }
  /* shimmer */
  .row .bar-fill::after{
    content:""; position:absolute; inset:0; transform:translateX(-120%);
    background:linear-gradient(120deg, transparent 0%, rgba(255,255,255,.6) 50%, transparent 100%);
    animation: shine 2.2s infinite; opacity:.25; pointer-events:none;
  }
  .panel .row .bar-fill{ width: var(--w, 0%); } /* set via style binding */

  @keyframes shine { from{transform:translateX(-120%)} to{transform:translateX(120%)} }

  .meta,.count{color:hsl(var(--muted-foreground));font-size:.85rem;min-width:88px;text-align:right}
  @media (max-width:1024px){.meta{min-width:72px}}
`]


})
export class ReviewFilterComponent {
  @Input() total = 0;
  @Input() breakdown: BreakdownItem[] = [];
  @Input() selectedRating: number | null = null;
  @Output() selectedRatingChange = new EventEmitter<number|null>();
  select(v:number|null){ this.selectedRatingChange.emit(v); }
}
