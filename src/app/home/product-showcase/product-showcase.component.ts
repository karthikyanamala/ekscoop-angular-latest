import {
  Component, ViewContainerRef, OnInit, OnDestroy,
  Input, HostBinding, Inject, EnvironmentInjector, PLATFORM_ID, computed
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthPopupComponent } from '../../payment/auth-popup/auth-popup.component';
import { AuthService } from '../../services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { ReviewService } from '../../services/review.service';
import { StarRatingComponent } from '../../components/star-rating/star-rating.component';

type VariantKey = 'traditional' | 'modern';
type VariantData = {
  name: string;
  image: string;
  description: string;
  features: string[];
  price: number;            // MRP
  discountedPrice?: number; // Offer price
  gallery: string[];
};

type CartLine = {
  productId: VariantKey;
  name: string;
  image: string;
  unitPrice: number;  // snapshot at add time
  qtyKg: number;      // 0.5, 1, 1.5, …
  mrp?: number | null;
  discountedPrice?: number | null;
};

const CART_KEY = 'cartItems';

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch { return []; }
}
function writeCart(items: CartLine[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

@Component({
  selector: 'app-product-showcase',
  standalone: true,
  // ⬅️ Only standalone components/directives/pipes or NgModules here.
  //    REMOVE ReviewService from imports (it’s a service, not a component).
  imports: [CommonModule, StarRatingComponent],
  templateUrl: './product-showcase.component.html',
  styleUrls: ['./product-showcase.component.css'],
})
export class ProductShowcaseComponent implements OnInit, OnDestroy {
  @Input() variant: 'default' | 'sidebar' = 'default';
  @HostBinding('class.sidebar') get isSidebar() { return this.variant === 'sidebar'; }

  selectedVariant: VariantKey | '' = '';
  quantity = 0.5;
  selectedImage = '';

  loadingPrices = true;
  private isBrowser = false;

  // Live public rating (approved-only) via ReviewService
  avgValue   = computed(() => this.rs.publicAverageRating());
  avgRounded = computed(() => Math.round(this.rs.publicAverageRating()));
  reviewCount = computed(() => this.rs.publicCount());

  variants: Record<VariantKey, VariantData> = {
    traditional: {
      name: 'Traditional Design',
      image: 'assets/traditional-webp.webp',
      description: 'Perfect for traditional Indian meals',
      features: ['Isolate','Supports Muscle Growth','Boost Immunity','Enhances Recovery','Vegan & Clean','Diabetic Friendly'],
      price: -1,
      discountedPrice: undefined,
      gallery: [
        'assets/trad-assets/Trad-sachet.PNG',
        'assets/trad-assets/Trad-power ranges.PNG',
        'assets/trad-assets/Trad-family.PNG',
        'assets/trad-assets/trad-ingredients.jpg',
        'assets/trad-assets/trad-certifications.jpg',
        'assets/trad-assets/Trad-nutritinalvalue.PNG',
        'assets/modren-assets/Quote.jpg'
      ]
    },
    modern: {
      name: 'Active Lifestyle',
      image: 'assets/modern.webp',
      description: 'Designed for active individuals',
      features: ['Feel stronger daily','Feel active','16.7g protein','Isolate','Supports Muscle Growth','Boost Immunity','Enhances Recovery','Vegan & Clean','Diabetic Friendly'],
      price: -1,
      discountedPrice: undefined,
      gallery: [
        'assets/modren-assets/Chootabheem.PNG',
        'assets/modren-assets/nutirition value.jpg',
        'assets/modren-assets/ingredients.jpg',
        'assets/modren-assets/certified.jpg',
        'assets/modren-assets/Lab Reports.jpg',
        'assets/modren-assets/Modren sachet - new.PNG',
        'assets/modren-assets/Quote.jpg'
      ]
    }
  };

  constructor(
    private viewContainerRef: ViewContainerRef,
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore,
    private rs: ReviewService,                     // ✅ inject service (not in imports)
    @Inject(DOCUMENT) private doc: Document,       // ✅ inject DOCUMENT → fixes this.doc error
    @Inject(PLATFORM_ID) platformId: Object,
    private envInjector: EnvironmentInjector
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit(): Promise<void> {
    if (this.isBrowser) {
      await this.loadPrices().finally(() => (this.loadingPrices = false));
      // ensure reviews loaded once (safe; service is a singleton)
      if (!this.rs.reviews().length && !this.rs.loading()) {
        await this.rs.loadReviews();
      }
    } else {
      this.loadingPrices = false;
    }
  }
  ngOnDestroy() {}

  /** Load MRP & Discounted_Price from Firestore — BROWSER ONLY */
  private async loadPrices() {
    const read = async (id: VariantKey) => {
      const snap = await getDoc(doc(this.firestore, `products/${id}`));
      if (!snap.exists()) return;
      const data = snap.data() as any;

      const price = Number(data?.price ?? -1);
      const discounted = Number(data?.Discounted_Price ?? data?.discountedPrice ?? NaN);

      this.variants[id].price = Number.isFinite(price) ? price : -1;
      this.variants[id].discountedPrice = Number.isFinite(discounted) ? discounted : undefined;
    };
    await Promise.all([read('traditional'), read('modern')]);
  }

  /** Effective unit price for a given variant (discount or MRP). */
  private effectivePrice(v: VariantData): number {
    const offer = v.discountedPrice ?? 0;
    if (offer > 0 && v.price > offer) return offer;
    return v.price > 0 ? v.price : 0;
  }

  // --- Display helpers ---
  get selectedVariantData() {
    return this.selectedVariant ? this.variants[this.selectedVariant] : null;
  }
  get displayUnitPrice(): number {
    const v = this.selectedVariantData; return v ? this.effectivePrice(v) : 0;
  }
  get displayMrp(): number | null {
    const v = this.selectedVariantData;
    if (!v) return null;
    const eff = this.effectivePrice(v);
    return v.price > eff && v.price > 0 ? v.price : null;
  }
  get discountPercent(): number {
    const v = this.selectedVariantData;
    if (!v) return 0;
    const eff = this.effectivePrice(v);
    if (v.price > eff && v.price > 0) {
      return Math.round(((v.price - eff) / v.price) * 100);
    }
    return 0;
  }
  get calculatedPrice(): number {
    const unit = this.displayUnitPrice;
    return unit > 0 ? unit * this.quantity : 0;
  }

  // Tiles:
  priceForTile(key: VariantKey): number { return this.effectivePrice(this.variants[key]); }
  mrpForTile(key: VariantKey): number | null {
    const v = this.variants[key]; const eff = this.effectivePrice(v);
    return v.price > eff && v.price > 0 ? v.price : null;
  }
  offForTile(key: VariantKey): number {
    const v = this.variants[key]; const eff = this.effectivePrice(v);
    return v.price > eff && v.price > 0 ? Math.round(((v.price - eff) / v.price) * 100) : 0;
  }

  selectVariant(key: string) {
    if (key === 'traditional' || key === 'modern') {
      this.selectedVariant = key as VariantKey;
      const selected = this.variants[this.selectedVariant];
      this.selectedImage = selected.gallery[0];
    }
  }

  increaseQuantity() { this.quantity = +(this.quantity + 0.5).toFixed(1); }
  decreaseQuantity() { if (this.quantity > 0.5) this.quantity = +(this.quantity - 0.5).toFixed(1); }

  private buildLine(): CartLine | null {
    const v = this.selectedVariantData;
    if (!this.selectedVariant || !v) return null;
    const unit = this.effectivePrice(v);
    if (unit <= 0) return null;

    return {
      productId: this.selectedVariant,
      name: v.name,
      image: v.image,
      unitPrice: unit,
      qtyKg: this.quantity,
      mrp: v.price,
      discountedPrice: v.discountedPrice ?? null,
    };
    }

  /** Merge by same productId + unitPrice */
  private upsertIntoCart(line: CartLine) {
    const cart = readCart();
    const idx = cart.findIndex(
      it => it.productId === line.productId && it.unitPrice === line.unitPrice
    );
    if (idx >= 0) {
      cart[idx].qtyKg = +(cart[idx].qtyKg + line.qtyKg).toFixed(1);
    } else {
      cart.push(line);
    }
    writeCart(cart);
  }

  async addToCart() {
    if (!this.selectedVariant) return alert('Please select a variant first.');
    const user = await firstValueFrom(this.authService.getCurrentUser());
    if (!user) { this.showLoginPopup(); return; }

    const line = this.buildLine();
    if (!line) return alert('Price unavailable.');

    this.upsertIntoCart(line);
    alert('Added to cart!');
  }

  /** Buy Now = ensure in cart then go to checkout */
  async buyNow() {
    if (!this.selectedVariant) return alert('Please select a variant first.');
    const user = await firstValueFrom(this.authService.getCurrentUser());
    if (!user) { this.showLoginPopup(); return; }

    const line = this.buildLine();
    if (!line) return alert('Price unavailable.');
    this.upsertIntoCart(line);

    this.router.navigate(['/checkout']);
  }

  showLoginPopup() {
    if (!this.isBrowser) return;
    this.viewContainerRef.clear();

    const componentRef = this.viewContainerRef.createComponent(AuthPopupComponent, {
      environmentInjector: this.envInjector,
    });

    componentRef.instance.closed.subscribe(() => {
      this.viewContainerRef.clear();
    });

    const onAuthSuccess = () => {
      this.viewContainerRef.clear();
      window.removeEventListener('auth-success', onAuthSuccess);
      alert('Login successful!');
      this.buyNow();
    };
    window.addEventListener('auth-success', onAuthSuccess);
  }

  /** Scroll to reviews (home section id="home-reviews"), or route there */
  goToReviews() {
    const anchorId = 'home-reviews';
    if (this.isBrowser) {
      const el = this.doc.getElementById(anchorId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    this.router.navigate(['/'], { fragment: anchorId });
  }

  selectGalleryImage(img: string) { this.selectedImage = img; }
}
