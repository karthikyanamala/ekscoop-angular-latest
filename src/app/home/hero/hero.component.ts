import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnInit, OnDestroy {
  isMobile = false;
  showModern = true;

  private toggleTimer: any = null;

  ngOnInit(): void {
    this.updateIsMobile();
    this.startOrStopMobileToggle();
  }

  ngOnDestroy(): void {
    if (this.toggleTimer) clearInterval(this.toggleTimer);
  }

  @HostListener('window:resize')
  onResize() {
    const before = this.isMobile;
    this.updateIsMobile();
    if (before !== this.isMobile) this.startOrStopMobileToggle();
  }

  private updateIsMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  private startOrStopMobileToggle() {
    // clear existing interval first
    if (this.toggleTimer) {
      clearInterval(this.toggleTimer);
      this.toggleTimer = null;
    }
    // Only toggle on MOBILE; desktop/tablet remain unchanged
    if (this.isMobile) {
      this.toggleTimer = setInterval(() => (this.showModern = !this.showModern), 2000);
    } else {
      this.showModern = true; // keep Modern static on larger screens
    }
  }

  scrollToProduct() {
    const el = document.getElementById('product-showcase');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
