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

// IMPORTANT: keys must match Firestore doc IDs expected by the Cloud Function
type VariantKey = 'traditional' | 'modern' | 'fridaydeal' | 'trailpack';

type VariantData = {
  name: string;
  image: string;
  description: string;
  features: string[];
  price: number;                 // display price
  discountedPrice?: number;
  delivery?: number;             // ← used only for fridaydeal (delivery fee)
  gallery: string[];
};

type CartLine = {
  productId: VariantKey;
  name: string;
  image: string;
  unitPrice: number;             // what we charge in checkout
  qtyKg: number;                 // promos: packs; normal: kg
  mrp?: number | null;
  discountedPrice?: number | null;
};

const CART_KEY = 'cartItems';

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartLine[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

// Enable offer only from Dec 30 to Jan 2 (every year)
const isInFreeSachetWindow = () => {
  const now = new Date();
  const month = now.getMonth(); // 0 = Jan, 11 = Dec
  const day = now.getDate();

  const isDecWindow = month === 11 && day >= 30; // Dec 30–31
  const isJanWindow = month === 0 && day <= 2;   // Jan 1–2

  return isDecWindow || isJanWindow;
};

@Component({
  selector: 'app-product-showcase',
  standalone: true,
  imports: [CommonModule, StarRatingComponent],
  templateUrl: './product-showcase.component.html',
  styleUrls: ['./product-showcase.component.css'],
})
export class ProductShowcaseComponent implements OnInit, OnDestroy {
  @Input() variant: 'default' | 'sidebar' = 'default';
  @HostBinding('class.sidebar') get isSidebar() { return this.variant === 'sidebar'; }

  selectedVariant: VariantKey | '' = '';
  quantity = 0.5; // normal products only
  selectedImage = '';

  loadingPrices = true;
  private isBrowser = false;

  avgValue   = computed(() => this.rs.publicAverageRating());
  avgRounded = computed(() => Math.round(this.rs.publicAverageRating()));
  reviewCount = computed(() => this.rs.publicCount());

  variants: Record<VariantKey, VariantData> = {
    traditional: {
      name: 'Traditional Design',
      image: 'assets/traditional-webp.webp',
      description: 'Perfect for traditional Indian meals',
      features: [
        'Isolate',
        'Supports Muscle Growth',
        'Boost Immunity',
        'Enhances Recovery',
        'Vegan & Clean',
        'Diabetic Friendly'
      ],
      price: -1,
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
      features: [
        'Feel stronger daily',
        'Feel active',
        '16.7g protein',
        'Isolate',
        'Supports Muscle Growth',
        'Boost Immunity',
        'Enhances Recovery',
        'Vegan & Clean',
        'Diabetic Friendly'
      ],
      price: -1,
      gallery: [
        'assets/modren-assets/Chootabheem.PNG',
        'assets/modren-assets/nutirition value.jpg',
        'assets/modren-assets/ingredients.jpg',
        'assets/modren-assets/certified.jpg',
        'assets/modren-assets/Lab Reports.jpg',
        'assets/modren-assets/Modren sachet - new.PNG',
        'assets/modren-assets/Quote.jpg'
      ]
    },

    // PROMO VARIANTS
    fridaydeal: {
      name: 'Friday Deal – Free 3 Sachets',
      image: 'assets/traditional-webp.webp',
      description: 'Pay delivery fee only between 30 Dec and 2 Jan; receive 3 sachets free.',
      features: [
        '3 sachets included',
        'Feel stronger daily',
        'Feel active',
        '16.7g protein',
        'Isolate',
        'Supports Muscle Growth',
        'Boost Immunity',
        'Enhances Recovery',
        'Vegan & Clean',
        'Diabetic Friendly',
        'Available only from 30 Dec to 2 Jan',
        'No quantity selection'
      ],
      price: 0,                  // ← show ₹0 on product page
      delivery: 49,              // ← what we actually charge at checkout
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
    trailpack: {
      name: 'Trial Pack – 3 Sachets',
      image: 'assets/modern.webp',
      description: 'Flat ₹180. Claim back ₹180 on your next 1 kg order.',
      features: [
        '3 sachets included',
        'Flat ₹180',
        '₹180 credit on next 1 kg order',
        'No quantity selection',
        'Feel stronger daily',
        'Feel active',
        '16.7g protein',
        'Isolate',
        'Supports Muscle Growth',
        'Boost Immunity',
        'Enhances Recovery',
        'Vegan & Clean',
        'Diabetic Friendly'
      ],
      price: 180,
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

  get isPromoSelected() {
    return this.selectedVariant === 'fridaydeal' || this.selectedVariant === 'trailpack';
  }

  // Now tied to the Dec 30 – Jan 2 window instead of Friday
  get isFridayEnabled() {
    return isInFreeSachetWindow();
  }

  constructor(
    private viewContainerRef: ViewContainerRef,
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore,
    private rs: ReviewService,
    @Inject(DOCUMENT) private doc: Document,
    @Inject(PLATFORM_ID) platformId: Object,
    private envInjector: EnvironmentInjector
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit(): Promise<void> {
    if (this.isBrowser) {
      await this.loadPrices().finally(() => (this.loadingPrices = false));
      if (!this.rs.reviews().length && !this.rs.loading()) {
        await this.rs.loadReviews();
      }
    } else {
      this.loadingPrices = false;
    }
  }

  ngOnDestroy() {}

  private async loadPrices() {
    const ids: VariantKey[] = ['traditional', 'modern']; // promos are fixed; skip Firestore
    const read = async (id: VariantKey) => {
      const snap = await getDoc(doc(this.firestore, `products/${id}`));
      if (!snap.exists()) return;
      const data = snap.data() as any;
      const price = Number(data?.price ?? -1);
      const discounted = Number(data?.Discounted_Price ?? data?.discountedPrice ?? NaN);
      this.variants[id].price = Number.isFinite(price) ? price : -1;
      this.variants[id].discountedPrice = Number.isFinite(discounted) ? discounted : undefined;
    };
    await Promise.all(ids.map(read));
  }

  private effectivePrice(v: VariantData): number {
    const offer = v.discountedPrice ?? 0;
    if (offer > 0 && v.price > offer) return offer;
    return v.price > 0 ? v.price : 0;
  }

  get selectedVariantData() {
    return this.selectedVariant ? this.variants[this.selectedVariant] : null;
  }

  get displayUnitPrice(): number {
    // Show ₹0 for fridaydeal on the product page
    if (this.selectedVariant === 'fridaydeal') return 0;
    const v = this.selectedVariantData;
    return v ? this.effectivePrice(v) : 0;
  }

  get displayMrp(): number | null {
    if (this.isPromoSelected) return null;
    const v = this.selectedVariantData;
    if (!v) return null;
    const eff = this.effectivePrice(v);
    return v.price > eff && v.price > 0 ? v.price : null;
  }

  get discountPercent(): number {
    if (this.isPromoSelected) return 0;
    const v = this.selectedVariantData;
    if (!v) return 0;
    const eff = this.effectivePrice(v);
    return v.price > eff && v.price > 0
      ? Math.round(((v.price - eff) / v.price) * 100)
      : 0;
  }

  get calculatedPrice(): number {
    if (this.isPromoSelected) return this.displayUnitPrice; // fridaydeal shows 0 here
    const unit = this.displayUnitPrice;
    return unit > 0 ? unit * this.quantity : 0;
  }

  priceForTile(key: VariantKey): number {
    // Tiles: show 0 for fridaydeal
    if (key === 'fridaydeal') return 0;
    return this.effectivePrice(this.variants[key]);
  }

  mrpForTile(key: VariantKey): number | null {
    if (key === 'fridaydeal' || key === 'trailpack') return null;
    const v = this.variants[key];
    const eff = this.effectivePrice(v);
    return v.price > eff && v.price > 0 ? v.price : null;
  }

  offForTile(key: VariantKey): number {
    if (key === 'fridaydeal' || key === 'trailpack') return 0;
    const v = this.variants[key];
    const eff = this.effectivePrice(v);
    return v.price > eff && v.price > 0
      ? Math.round(((v.price - eff) / v.price) * 100)
      : 0;
  }

  selectVariant(key: string) {
    if (key === 'traditional' || key === 'modern' || key === 'fridaydeal' || key === 'trailpack') {
      this.selectedVariant = key as VariantKey;
      const selected = this.variants[this.selectedVariant];
      this.selectedImage = selected.gallery[0];
      if (!this.isPromoSelected && this.quantity < 0.5) this.quantity = 0.5;
    }
  }

  increaseQuantity() {
    if (!this.isPromoSelected) {
      this.quantity = +(this.quantity + 0.5).toFixed(1);
    }
  }

  decreaseQuantity() {
    if (!this.isPromoSelected && this.quantity > 0.5) {
      this.quantity = +(this.quantity - 0.5).toFixed(1);
    }
  }

  private buildLine(): CartLine | null {
    const v = this.selectedVariantData;
    if (!this.selectedVariant || !v) return null;

    // What we actually charge at checkout:
    const unit =
      this.selectedVariant === 'fridaydeal'
        ? (this.variants.fridaydeal.delivery ?? 49)  // ← charge delivery fee
        : this.effectivePrice(v);

    if (unit < 0) return null;

    const qty = this.isPromoSelected ? 1 : Math.max(this.quantity, 0.5);

    return {
      productId: this.selectedVariant,
      name: v.name,
      image: v.image,
      unitPrice: unit,
      qtyKg: qty,
      mrp: v.price,
      discountedPrice: v.discountedPrice ?? null,
    };
  }

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

    if (this.selectedVariant === 'fridaydeal' && !this.isFridayEnabled) {
      alert('This free sachet offer is now available from 30 Dec to 2 Jan.');
      return;
    }

    const line = this.buildLine();
    if (!line) return alert('Price unavailable.');
    this.upsertIntoCart(line);
    alert('Added to cart!');
  }

  async buyNow() {
    if (!this.selectedVariant) return alert('Please select a variant first.');
    const user = await firstValueFrom(this.authService.getCurrentUser());
    if (!user) { this.showLoginPopup(); return; }

    if (this.selectedVariant === 'fridaydeal' && !this.isFridayEnabled) {
      alert('This free sachet offer is now available from 30 Dec to 2 Jan.');
      return;
    }

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

  selectGalleryImage(img: string) {
    this.selectedImage = img;
  }
}