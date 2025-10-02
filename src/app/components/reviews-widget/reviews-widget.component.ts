import {
  Component, computed, inject, signal, AfterViewInit, ViewChild, ElementRef,
  HostListener, Inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ReviewService } from '../../services/review.service';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { ReviewCardComponent } from '../review-card/review-card.component';

@Component({
  selector: 'app-reviews-widget',
  standalone: true,
  imports: [CommonModule, RouterModule, StarRatingComponent, ReviewCardComponent],
  templateUrl: './reviews-widget.component.html',
  styleUrls: ['./reviews-widget.component.css'],
})
export class ReviewsWidgetComponent implements AfterViewInit {
  rs = inject(ReviewService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Keep widget tidy even with many reviews */
  readonly MAX = 12;

  avgRounded = computed(() => Math.round(this.rs.averageRating()));
  items = computed(() => this.rs.reviews().slice(0, this.MAX));

  @ViewChild('rail', { static: false }) railRef?: ElementRef<HTMLDivElement>;

  /** nav button state */
  canPrev = signal(false);
  canNext = signal(true);

  /** stride = one card width + grid gap (computed after view init) */
  private stride = 420;

  ngAfterViewInit() {
    if (!this.isBrowser || !this.railRef) return;

    // compute stride from first card + CSS gap
    setTimeout(() => this.computeStride(), 0);

    const el = this.railRef.nativeElement;
    const update = () => this.updateNavButtons();

    el.addEventListener('scroll', update, { passive: true });
    // initial state
    this.updateNavButtons();
  }

  @HostListener('window:resize')
  onResize() {
    if (!this.isBrowser) return;
    this.computeStride();
    this.updateNavButtons();
  }

  private computeStride() {
    const el = this.railRef?.nativeElement;
    if (!el) return;

    const first = el.querySelector<HTMLElement>('.rw__snap');
    const styles = getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || '16');

    if (first) {
      this.stride = Math.max(260, first.offsetWidth + gap);
    }
  }

  private updateNavButtons() {
    const el = this.railRef?.nativeElement;
    if (!el) return;

    const max = el.scrollWidth - el.clientWidth - 1; // -1 = float tolerance
    this.canPrev.set(el.scrollLeft > 4);
    this.canNext.set(el.scrollLeft < max);
  }

  prev() {
    const el = this.railRef?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: -this.stride, behavior: 'smooth' });
    setTimeout(() => this.updateNavButtons(), 260);
  }

  next() {
    const el = this.railRef?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: this.stride, behavior: 'smooth' });
    setTimeout(() => this.updateNavButtons(), 260);
  }

  /** keyboard accessibility for the rail */
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
  }
}
