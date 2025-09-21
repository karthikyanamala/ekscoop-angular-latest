import {
  Component, ViewContainerRef, OnInit, OnDestroy,
  Input, HostBinding, Inject, EnvironmentInjector, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthPopupComponent } from '../../payment/auth-popup/auth-popup.component';
import { AuthService } from '../../services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

type VariantKey = 'traditional' | 'modern';
type VariantData = {
  name: string;
  image: string;
  description: string;
  features: string[];
  price: number;               // MRP
  discountedPrice?: number;    // Offer price
  gallery: string[];
};

@Component({
  selector: 'app-product-showcase',
  standalone: true,
  imports: [CommonModule, AuthPopupComponent],
  templateUrl: './product-showcase.component.html',
  styleUrls: ['./product-showcase.component.css'],
})
export class ProductShowcaseComponent implements OnInit, OnDestroy {
  @Input() variant: 'default' | 'sidebar' = 'default';
  @HostBinding('class.sidebar') get isSidebar() { return this.variant === 'sidebar'; }

  selectedVariant: VariantKey | '' = '';
  quantity = 0.5;
  selectedImage = '';

  /** render hint so we can avoid showing 0s while SSR hydrating */
  loadingPrices = true;

  variants: Record<VariantKey, VariantData> = {
    traditional: {
      name: 'Traditional Design',
      image: 'assets/traditional-webp.webp',
      description: 'Perfect for traditional Indian meals',
      features: ['Isolate','Supports Muscle Growth', 'Boost Immunity', 'Enhances Recovery', 'Vegan & Clean', 'Diabetic Friendly'],
      price: -1,
      discountedPrice: undefined,
      gallery: [
        'assets/trad-assets/Trad-sachet.PNG',
        'assets/trad-assets/Trad-power ranges.PNG',
        'assets/trad-assets/Trad-family.PNG',
        "assets/trad-assets/trad-ingredients.jpg",
        'assets/trad-assets/trad-certifications.jpg',
        'assets/trad-assets/Trad-nutritinalvalue.PNG',
        'assets/modren-assets/Quote.jpg'
      ]
    },
    modern: {
      name: 'Active Lifestyle',
      image: 'assets/modern.webp',
      description: 'Designed for active individuals',
      features: ['Feel stronger daily', 'Feel active', '16.7g protein','Isolate','Supports Muscle Growth', 'Boost Immunity', 'Enhances Recovery', 'Vegan & Clean', 'Diabetic Friendly'],
      price: -1,
      discountedPrice: undefined,
      gallery: [
        'assets/modren-assets/Chootabheem.PNG',
        'assets/modren-assets/nutirition value.jpg',
        'assets/modren-assets/ingredients.jpg',
        'assets/modren-assets/certified.jpg',
        "assets/modren-assets/Lab Reports.jpg",
        'assets/modren-assets/Modren sachet - new.PNG',
        'assets/modren-assets/Quote.jpg'
      ]
    }
  };

  private isBrowser = false;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore,
    @Inject(PLATFORM_ID) platformId: Object,
    private envInjector: EnvironmentInjector
  ) { this.isBrowser = isPlatformBrowser(platformId); }

  ngOnInit(): void {
    // ✅ Don’t touch AngularFire on the server
    if (this.isBrowser) {
      this.loadPrices().finally(() => (this.loadingPrices = false));
    } else {
      this.loadingPrices = false; // render skeleton quickly on SSR
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
      const discounted = Number(
        data?.Discounted_Price ?? data?.discountedPrice ?? NaN
      );

      this.variants[id].price = isFinite(price) ? price : -1;
      this.variants[id].discountedPrice = isFinite(discounted) ? discounted : undefined;
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

 // start with 1 kg (or 0.5 if you prefer)

// Increase in 0.5 kg steps
increaseQuantity() {
  this.quantity = +(this.quantity + 0.5).toFixed(1);
}

// Decrease in 0.5 kg steps, min 0.5
decreaseQuantity() {
  if (this.quantity > 0.5) {
    this.quantity = +(this.quantity - 0.5).toFixed(1);
  }
}


  async handleBuyNow() {
    if (!this.selectedVariant) return alert('Please select a variant first.');
    const v = this.selectedVariantData; if (!v) return;
    const unit = this.effectivePrice(v);
    if (unit <= 0) return alert('Price unavailable.');

    const user = await firstValueFrom(this.authService.getCurrentUser());
    if (!user) { this.showLoginPopup(); return; }

    // localStorage is browser-only; this runs after hydration
    localStorage.setItem('checkoutProduct', JSON.stringify({
      productId: this.selectedVariant,
      product: { name: v.name, image: v.image },
      quantity: this.quantity,
      unitPrice: unit,
      mrp: v.price,
      discountedPrice: v.discountedPrice ?? null
    }));

    this.router.navigate(['/checkout']);
  }

showLoginPopup() {
  if (!this.isBrowser) return;
  this.viewContainerRef.clear();

  const componentRef = this.viewContainerRef.createComponent(AuthPopupComponent, {
    environmentInjector: this.envInjector,
  });

  // Subscribe to the close/cancel event
  componentRef.instance.closed.subscribe(() => {
    this.viewContainerRef.clear();
  });

  const onAuthSuccess = () => {
    this.viewContainerRef.clear();
    window.removeEventListener('auth-success', onAuthSuccess);
    alert('Login successful!');
    this.handleBuyNow();
  };
  window.addEventListener('auth-success', onAuthSuccess);
}


  selectGalleryImage(img: string) { this.selectedImage = img; }
}
