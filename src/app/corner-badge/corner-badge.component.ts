import { Component, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProfileComponent } from '../profile/profile.component';

type CartLine = {
  productId: 'modern' | 'traditional';
  name: string;
  image: string;
  unitPrice: number;
  qtyKg: number;
  mrp?: number | null;
  discountedPrice?: number | null;
};

const CART_KEY = 'cartItems';

@Component({
  selector: 'app-corner-badge',
  standalone: true,
  imports: [ProfileComponent],
  templateUrl: './corner-badge.component.html',
  styleUrl: './corner-badge.component.css'
})
export class CornerBadgeComponent implements OnInit, OnDestroy {
  isScrolled = false;
  menuOpen = false;

  cartCountLabel = '0';

  private isBrowser = false;
  private intervalId: any = null;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!this.isBrowser) return;
    this.isScrolled = (typeof window !== 'undefined') && window.scrollY > 10;
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.refreshCartCount();

    // Live updates across tabs & focus
    window.addEventListener('storage', this.onExternalStorageChange);
    window.addEventListener('focus', this.onWindowFocus);
    window.addEventListener('cart-updated', this.onCartUpdated as EventListener);

    // Light polling (covers cases where event isn’t dispatched)
    this.intervalId = setInterval(() => this.refreshCartCount(), 2000);
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;

    window.removeEventListener('storage', this.onExternalStorageChange);
    window.removeEventListener('focus', this.onWindowFocus);
    window.removeEventListener('cart-updated', this.onCartUpdated as EventListener);

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  toggleMenu() { this.menuOpen = !this.menuOpen; }
  closeMenu() { this.menuOpen = false; }

  // ------- Cart helpers (browser only) -------
  private readCart(): CartLine[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  }

  private getCartCountLabel(): string {
    const items = this.readCart();
    const totalKg = items.reduce((s, it) => s + (Number(it?.qtyKg) || 0), 0);
    if (totalKg <= 0) return '0';
    const label = Number.isInteger(totalKg) ? `${totalKg}` : totalKg.toFixed(1);
    return parseFloat(label) > 99 ? '99+' : label;
  }

  private refreshCartCount() {
    this.cartCountLabel = this.getCartCountLabel();
  }

  // listeners (bound properties so we can remove them)
  private onExternalStorageChange = (e: StorageEvent) => {
    if (e.key === CART_KEY) this.refreshCartCount();
  };
  private onWindowFocus = () => {
    this.refreshCartCount();
  };
  private onCartUpdated = () => {
    this.refreshCartCount();
  };
}
