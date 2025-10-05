import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
})
export class HeroComponent implements OnInit, OnDestroy {
  showModern = true;
  private toggleTimer: any = null;
  private mql: MediaQueryList | null = null;

  ngOnInit(): void {
    // Start/stop the toggle based on viewport (mobile only)
    this.mql = window.matchMedia('(max-width: 768px)');
    const control = () => {
      if (this.toggleTimer) { clearInterval(this.toggleTimer); this.toggleTimer = null; }
      if (this.mql!.matches) {
        this.toggleTimer = setInterval(() => (this.showModern = !this.showModern), 2000);
      } else {
        this.showModern = true; // keep modern static on larger screens
      }
    };

    // initial
    control();

    // respond to breakpoint changes
    this.mql.addEventListener?.('change', control);
    (this.mql as any).addListener?.(control); // older Safari fallback
  }

  ngOnDestroy(): void {
    if (this.toggleTimer) clearInterval(this.toggleTimer);
    if (this.mql) {
      this.mql.removeEventListener?.('change', () => {});
      (this.mql as any).removeListener?.(() => {});
    }
  }

  scrollToProduct() {
    const el = document.getElementById('product-showcase');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
