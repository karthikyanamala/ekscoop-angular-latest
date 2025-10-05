import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../services/review.service';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule, StarRatingComponent],
  template: `
  <section class="card" aria-labelledby="reviewFormTitle">
    <header class="header">
      <h3 id="reviewFormTitle">Share Your Experience</h3>
      <p class="sub">It only takes a minute. Your feedback helps other families.</p>
    </header>

    <ng-container *ngIf="rs.eligibilityRemaining() > 0; else locked">
      <!-- STEP 1: Order -->
      <div class="step">
        <div class="step-head">
          <span class="badge">1</span>
          <h4>Choose Order</h4>
        </div>

        <!-- Selected summary -->
        <div class="selected-row" *ngIf="orderId(); else noSelection">
          <button type="button" class="order-pill active" [title]="orderId()">
            <span class="dot"></span>
            <span class="id">{{ shortId(orderId()!) }}</span>
            <span class="ok">Selected</span>
          </button>

          <button type="button" class="link" (click)="pickerOpen.set(!pickerOpen())">
            {{ pickerOpen() ? 'Hide list' : 'Change' }}
          </button>
        </div>

        <ng-template #noSelection>
          <p class="help">Pick the order you want to review.</p>
          <button type="button" class="link" (click)="pickerOpen.set(true)">Choose order</button>
        </ng-template>

        <!-- Picker list (radios) -->
        <div class="picker" *ngIf="pickerOpen()">
          <div class="radio-list" role="radiogroup" aria-label="Eligible orders">
            <label class="radio" *ngFor="let id of eligibleOrderIds()">
              <input
                type="radio"
                name="order"
                [value]="id"
                [checked]="orderId() === id"
                (change)="orderId.set(id)"
              />
              <span class="radio-text">
                <strong>{{ shortId(id) }}</strong>
                <span class="muted-id">{{ id }}</span>
              </span>
            </label>
          </div>

          <label class="sr-only" for="orderSelect">Order to review</label>
          <select id="orderSelect" class="a11y-select" [ngModel]="orderId()" (ngModelChange)="orderId.set($event)">
            <option *ngFor="let id of eligibleOrderIds()" [value]="id">{{ id }}</option>
          </select>
          <p class="help">One review per order.</p>
        </div>
      </div>

      <!-- STEP 2: Rating -->
      <div class="step">
        <div class="step-head">
          <span class="badge">2</span>
          <h4>Your Rating</h4>
        </div>
        <app-star-rating
          [rating]="rating()"
          (ratingChange)="rating.set($event)"
          aria-label="Your rating from 1 to 5 stars">
        </app-star-rating>
        <p class="rating-label" *ngIf="rating() > 0">{{ ratingText(rating()) }}</p>
        <p class="help" *ngIf="rating() === 0">Tap the stars to rate your experience (1–5).</p>
      </div>

      <!-- STEP 3: Review -->
      <div class="step">
        <div class="step-head">
          <span class="badge">3</span>
          <h4>Write a short review</h4>
        </div>
        <textarea
          [ngModel]="text()"
          (ngModelChange)="text.set($event)"
          placeholder="Tell us how you added YOU x 0.8 to your meals and what changed for you…"
          rows="5"
          maxlength="600"
          aria-label="Your review text"
        ></textarea>
        <div class="meta-row">
          <p class="help">Min 20 characters works best for shoppers.</p>
          <span class="counter">{{ charCount() }}/600</span>
        </div>
      </div>

      <!-- Sticky actions -->
      <div class="actions">
        <button
          class="submit enabled"
          type="button"
          (click)="submit()"
          [attr.aria-busy]="submitting()"
        >
          {{ submitting() ? 'Submitting…' : 'Submit Review' }}
        </button>
      </div>
    </ng-container>

    <ng-template #locked>
      <div class="locked">
        <p>
          Reviews unlock automatically once your order is
          <strong>Completed</strong>. This ensures that every review comes from a genuine customer.
        </p>
        <p class="muted">Place an order and come back — we’d love to hear from you!</p>
      </div>
    </ng-template>
  </section>
  `,
  styles: [`
    :host { display:block }
    .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    .card{
      border:1px solid hsl(var(--border));
      border-radius:18px;
      padding:18px 18px 12px;
      background:#fff;
      box-shadow:0 6px 20px rgba(16,24,40,.04), 0 1px 0 rgba(16,24,40,.03);
    }
    .header h3{margin:0;font-size:1.25rem;font-weight:800}
    .sub{margin:.25rem 0 0;color:hsl(var(--muted-foreground))}
    .step{margin-top:18px}
    .step-head{display:flex;gap:10px;align-items:center;margin-bottom:8px}
    h4{margin:0;font-size:1rem;font-weight:800}
    .badge{
      width:22px;height:22px;border-radius:50%;
      display:inline-flex;align-items:center;justify-content:center;
      background:hsl(var(--primary));color:#fff;font-size:.8rem;font-weight:800
    }

    .selected-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .link{
      border:none;background:none;color:hsl(16 90% 45%);font-weight:700;cursor:pointer;
      padding:6px 8px;border-radius:10px;
    }
    .link:hover{background:hsla(16,100%,60%,.08)}

    .order-grid{display:flex;gap:8px;flex-wrap:wrap}
    .order-pill{
      border:1px solid hsl(var(--border));
      background:#fff;border-radius:999px;padding:10px 14px;
      display:inline-flex;gap:8px;align-items:center;
      transition:box-shadow .15s, border-color .15s, transform .02s;
      box-shadow:0 1px 0 rgba(0,0,0,.02);
    }
    .order-pill:hover{box-shadow:0 8px 18px rgba(16,24,40,.08)}
    .order-pill:active{transform:translateY(1px)}
    .order-pill.active{border-color:hsl(var(--primary));box-shadow:0 0 0 4px hsl(16 100% 60% / .12)}
    .order-pill .dot{width:8px;height:8px;border-radius:50%;background:hsl(var(--primary))}
    .order-pill .id{font-weight:700}
    .order-pill .ok{font-weight:700;color:hsl(var(--primary))}

    .picker{margin-top:10px}
    .radio-list{display:flex;flex-direction:column;gap:8px}
    .radio{
      display:flex;gap:10px;align-items:flex-start;
      padding:10px 12px;border:1px solid hsl(var(--border));border-radius:12px;background:#fff;
    }
    .radio input{margin-top:2px}
    .radio-text{display:flex;flex-direction:column}
    .muted-id{color:hsl(var(--muted-foreground));font-size:.85rem;word-break:break-all}

    .a11y-select{position:absolute;left:-9999px}

    app-star-rating{display:inline-block}
    .rating-label{margin:.4rem 0 0;font-weight:700;color:hsl(var(--accent-foreground))}
    textarea{
      width:100%;border:1px solid hsl(var(--border));border-radius:14px;
      background:#fff;box-shadow:0 1px 0 rgba(0,0,0,.02);padding:12px 14px;resize:vertical;min-height:120px
    }
    .help{margin:.35rem 0 0;color:hsl(var(--muted-foreground));font-size:.9rem}
    .meta-row{display:flex;justify-content:space-between;align-items:center;margin-top:6px}
    .counter{color:hsl(var(--muted-foreground));font-size:.9rem}

    .actions{
      bottom:0; z-index:2; padding-top:12px; margin-top:10px;
      background:linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 38%);
    }

    /* Submit button */
    .submit{
      width:100%;height:48px;border:none;border-radius:14px;
      font-weight:800;letter-spacing:.01em;transition:transform .05s, box-shadow .15s, filter .15s;
      color:#fff;
    }
    .submit.enabled{
      background:#e11d48; /* red */
      cursor:pointer;
      box-shadow:0 8px 18px rgba(225,29,72,.22);
    }
    .submit.enabled:hover{ filter:brightness(1.03) }
    .submit.enabled:active{ transform:translateY(1px) }

    .locked{padding:8px 2px}
    .muted{color:hsl(var(--muted-foreground))}
  `]
})
export class ReviewFormComponent implements OnInit {
  rs = inject(ReviewService);

  // state
  orderId = signal<string | null>(null);
  pickerOpen = signal(false);
  rating = signal(0);
  text = signal('');
  submitting = signal(false);

  // derived
  eligibleOrderIds = computed(() => {
    const orders = this.rs.eligibilityOrders() || {};
    return Object.keys(orders).filter(id => orders[id] === true);
  });
  charCount = computed(() => this.text().length);

  // react to async eligibility arriving later
  autoPick = effect(() => {
    const ids = this.eligibleOrderIds();
    if (ids.length && !this.orderId()) {
      this.orderId.set(ids[0]);
    }
  });

  ngOnInit() {
    // keep for SSR/early cases; effect covers async updates
    const ids = this.eligibleOrderIds();
    if (ids.length && !this.orderId()) this.orderId.set(ids[0]);
  }

  shortId(id: string) {
    if (!id) return '';
    return id.length > 18 ? id.slice(0, 10) + '…' + id.slice(-5) : id;
  }

  ratingText(v: number) {
    const map = ['','Poor','Fair','Good','Very Good','Excellent'];
    return map[v] || '';
  }

  async submit() {
    if (this.submitting()) return;

    // safety: if ids exist but orderId missing (async), pick first now
    if (!this.orderId() && this.eligibleOrderIds().length) {
      this.orderId.set(this.eligibleOrderIds()[0]);
    }

    const issues: string[] = [];
    if (!this.orderId()) issues.push('Please select an order to review.');
    if (this.rating() <= 0) issues.push('Please tap the stars and give a rating.');
    if (this.text().trim().length < 20) issues.push('Please write a short review (min 20 characters).');

    if (issues.length) {
      alert(issues[0]); // replace with your toast/snackbar
      // if missing order, open picker so user sees choices
      if (!this.orderId()) this.pickerOpen.set(true);
      return;
    }

    this.submitting.set(true);
    try {
      await this.rs.submitReviewForOrder(this.orderId()!, {
        name: this.rs.displayName(),
        rating: this.rating(),
        text: this.text().trim(),
      });
      this.rating.set(0);
      this.text.set('');
      this.pickerOpen.set(false);
      // show toast: “Thanks for your review!”
    } finally {
      this.submitting.set(false);
    }
  }
}
