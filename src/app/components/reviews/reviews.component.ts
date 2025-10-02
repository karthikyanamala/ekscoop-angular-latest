// src/app/pages/reviews/reviews.component.ts
import { Component, OnInit, computed,AfterViewInit, inject, signal, Inject,PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT,isPlatformBrowser  } from '@angular/common';

import { ReviewService } from '../../services/review.service';
import { ReviewCardComponent } from '../../components/review-card/review-card.component';
import { ReviewFormComponent } from '../../components/review-form/review-form.component';
import { ReviewFilterComponent } from '../../components/review-filter/review-filter.component';
import { StarRatingComponent } from '../../components/star-rating/star-rating.component';
import { RevealOnScrollDirective } from '../../shared/reveal-on-scroll.directive';

const PER_PAGE = 4;

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ReviewCardComponent, ReviewFormComponent, ReviewFilterComponent, StarRatingComponent,
    RevealOnScrollDirective
  ],
  template: `
  <section class="wrap">
    <header class="head" appRevealOnScroll>
      <h1>What Our Customers Say</h1>
      <div class="meta">
        <app-star-rating [rating]="avgRounded()" [readonly]="true"></app-star-rating>
        <span class="avg">{{rs.averageRating()}}</span>
        <span class="count">({{rs.reviews().length}} reviews)</span>
      </div>
      <p class="tag">Trusted by families across India for daily nutrition</p>
    </header>

    <div class="grid">
      <div class="side" appRevealOnScroll>
        <app-review-filter
          [total]="rs.reviews().length"
          [breakdown]="rs.breakdown()"
          [selectedRating]="selectedRating()"
          (selectedRatingChange)="onRatingSelect($event)">
        </app-review-filter>
      </div>

      <div class="main">
        <div class="toolbar" appRevealOnScroll>
          <h2>{{ title() }}</h2>
          <select [ngModel]="sort()" (ngModelChange)="setSort($event)">
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <div *ngIf="rs.loading()">Loading reviews…</div>
        <div *ngIf="rs.error()">{{rs.error()}}</div>

        <div class="list">
          <app-review-card *ngFor="let r of paged()" [review]="r" appRevealOnScroll></app-review-card>
        </div>

        <nav class="pager" *ngIf="pages() > 1" appRevealOnScroll>
          <button (click)="prev()" [disabled]="page()===1">‹</button>
          <button *ngFor="let p of pageArray()" [class.active]="p===page()" (click)="go(p)">{{p}}</button>
          <button (click)="next()" [disabled]="page()===pages()">›</button>
        </nav>

        <div class="form-zone" appRevealOnScroll>
          <app-review-form></app-review-form>
        </div>
      </div>
    </div>
  </section>
  `,
  styles: [`
    :root { --ease: cubic-bezier(.2,.7,.2,1); }

    /* reveal-in animation */
    .reveal{opacity:0;transform:translateY(18px) scale(.985);transition:transform .6s var(--ease),opacity .6s var(--ease)}
    .reveal.reveal-in{opacity:1;transform:translateY(0) scale(1)}

    .wrap{
      min-height:100vh;
      padding:120px 16px 76px;
      background:
        radial-gradient(1400px 800px at 80% -200px, hsl(16 100% 98%), transparent),
        #fff;
    }

    .head{text-align:center;max-width:1024px;margin:0 auto 32px}
    h1{font-size:clamp(32px,4.8vw,54px);line-height:1.08;letter-spacing:-.02em;margin:0 0 10px;font-weight:800}
    .meta{display:flex;gap:12px;align-items:center;justify-content:center;margin-bottom:6px}
    /* star 'pop' when header reveals */
    .head.reveal-in app-star-rating .star-btn.filled{
      animation: starPop 420ms var(--ease) both;
    }
    .head.reveal-in app-star-rating .star-btn.filled:nth-child(2){animation-delay:60ms}
    .head.reveal-in app-star-rating .star-btn.filled:nth-child(3){animation-delay:120ms}
    .head.reveal-in app-star-rating .star-btn.filled:nth-child(4){animation-delay:180ms}
    .head.reveal-in app-star-rating .star-btn.filled:nth-child(5){animation-delay:240ms}
    @keyframes starPop{
      0%{transform:scale(.5);filter:drop-shadow(0 0 0 hsla(16,100%,60%,0))}
      70%{transform:scale(1.1);filter:drop-shadow(0 0 8px hsla(16,100%,60%,.45))}
      100%{transform:scale(1);filter:none}
    }

    .avg{font-weight:800;font-size:clamp(20px,3vw,28px)}
    .count,.tag{color:hsl(var(--muted-foreground))}
    .tag{margin:4px 0 0}

    .grid{display:grid;grid-template-columns:1fr;gap:22px;max-width:1200px;margin:0 auto}
    .side{order:2}
    .main{order:1}

    .toolbar{display:flex;align-items:center;justify-content:space-between;margin:8px 0 16px}
    .toolbar h2{margin:0;font-size:1.2rem;font-weight:700}
    .toolbar select{
      appearance:none;border:1px solid hsl(var(--border));border-radius:999px;
      padding:10px 14px;background:#fff;min-width:140px;box-shadow:0 1px 0 rgba(0,0,0,.02)
    }

    .list{display:grid;grid-template-columns:1fr;gap:16px}

    .pager{display:flex;gap:8px;justify-content:center;margin:18px 0}
    .pager button{
      min-width:38px;height:38px;border-radius:999px;border:1px solid hsl(var(--border));
      background:#fff;box-shadow:0 1px 0 rgba(0,0,0,.02);transition:transform .05s, box-shadow .15s
    }
    .pager button:hover{box-shadow:0 8px 18px rgba(16,24,40,.08)}
    .pager button.active{background:hsl(var(--primary));color:#fff;border-color:hsl(var(--primary))}

    .form-zone{margin-top:20px}

    @media (min-width:1024px){
      .grid{grid-template-columns:310px 1fr;gap:26px}
      .side{order:1;position:sticky;top:24px;align-self:start}
      .main{order:2}
    }
  `]
})
export class ReviewsComponent implements OnInit, AfterViewInit {
  rs = inject(ReviewService);
  private titleSrv = inject(Title);
  private meta = inject(Meta);

  constructor(
    @Inject(DOCUMENT) private readonly doc: Document,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  private get isBrowser() { return isPlatformBrowser(this.platformId); }

  avgRounded = computed(() => Math.round(this.rs.averageRating()));

  private _selectedRating = signal<number | null>(null);
  private _sort = signal<'latest' | 'oldest'>('latest');
  private _page = signal(1);

  selectedRating = this._selectedRating.asReadonly();
  sort = this._sort.asReadonly();
  page = this._page.asReadonly();

  async ngOnInit() {
    // Only hit Firestore in the browser (avoids SSR logs/warnings)
    if (this.isBrowser) {
      await this.rs.loadReviews();
    }
  }

  ngAfterViewInit() {
    // Run SEO once the view/DOM exists and only in the browser
    if (this.isBrowser) {
      queueMicrotask(() => this.publishSeoSafe());
    }
  }

  /** Browser-only, DOM-safe SEO publisher */
  private publishSeoSafe(): void {
    try {
      const head = this.doc?.head as HTMLHeadElement | null;
      if (!head) return;

      const ratingValue = this.rs.averageRating() || 0;
      const reviewCount = this.rs.reviews().length || 0;

      const url = 'https://www.ekscoop.com/reviews';
      const title =
        `Customer Reviews | ekScoop Plant Protein (${ratingValue.toFixed(1)}★, ${reviewCount} reviews)`;
      const description =
        'Real customer reviews for ekScoop plant protein—vegan, unflavoured and easy to mix in Indian foods like roti, dal, poha and curd. Great for gym, recovery and daily nutrition. Fast shipping to Bengaluru, Hyderabad, Delhi NCR, Noida, Greater Noida, Mumbai, Vizag and Vijayawada.';

      // Title + canonical
      this.titleSrv.setTitle(title);

      let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = this.doc.createElement('link');
        link.rel = 'canonical';
        head.appendChild(link);
      }
      link.href = url;

      // Meta / OG / Twitter
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ property: 'og:url', content: url });
      this.meta.updateTag({ property: 'og:type', content: 'website' });
      this.meta.updateTag({ property: 'og:locale', content: 'en_IN' });
      this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
      this.meta.updateTag({ name: 'twitter:title', content: title });
      this.meta.updateTag({ name: 'twitter:description', content: description });

      // JSON-LD (Product + AggregateRating + sample reviews)
      const items = this.rs.reviews().slice(0, 10).map(r => ({
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: String(r.rating) },
        author: { '@type': 'Person', name: r.name || 'Customer' },
        reviewBody: r.text,
        datePublished:
          (r.createdAt as any)?.toDate?.()?.toISOString?.() ||
          (r.createdAt as Date)?.toISOString?.() ||
          ''
      }));

      this.upsertJsonLd('ld-reviews', {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'YOU x 0.8 Plant Protein (Unflavoured)',
        brand: { '@type': 'Brand', name: 'ekScoop' },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(ratingValue),
          reviewCount: String(reviewCount)
        },
        review: items
      });
    } catch (err) {
      // Never crash the page for SEO
      console.warn('publishSeo skipped:', err);
    }
  }

  private upsertJsonLd(id: string, json: object): void {
    const head = this.doc?.head as HTMLHeadElement | null;
    if (!head) return;

    let el = this.doc.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = this.doc.createElement('script');
      el.type = 'application/ld+json';
      el.id = id;
      head.appendChild(el);
    }
    el.text = JSON.stringify(json);
  }

  // ── your existing list/paging logic (unchanged) ─────────────────────────────
  filtered = computed(() => {
    const rating = this._selectedRating();
    let arr = rating ? this.rs.reviews().filter(r => r.rating === rating) : this.rs.reviews();
    arr = [...arr].sort((a, b) => {
      const da = (a.createdAt?.toDate?.() ?? a.createdAt) as Date;
      const db = (b.createdAt?.toDate?.() ?? b.createdAt) as Date;
      return this._sort() === 'latest' ? +db - +da : +da - +db;
    });
    return arr;
  });

  pages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PER_PAGE)));
  paged = computed(() => {
    const start = (this._page() - 1) * PER_PAGE;
    return this.filtered().slice(start, start + PER_PAGE);
  });

  title = computed(() =>
    this._selectedRating()
      ? `${this._selectedRating()} Star Reviews (${this.filtered().length})`
      : `All Reviews (${this.filtered().length})`
  );

  onRatingSelect(v: number | null) { this._selectedRating.set(v); this._page.set(1); }
  setSort(v: 'latest' | 'oldest') { this._sort.set(v); this._page.set(1); }
  prev() { this._page.set(Math.max(1, this._page() - 1)); }
  next() { this._page.set(Math.min(this.pages(), this._page() + 1)); }
  go(p: number) { this._page.set(p); }
  pageArray() { return Array.from({ length: this.pages() }, (_, i) => i + 1); }
}