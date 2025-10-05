import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  inject
} from '@angular/core';
import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  getDoc
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { CornerBadgeComponent } from '../../corner-badge/corner-badge.component';
import { FooterComponent } from '../../footer/footer.component';

declare var Razorpay: any;

type PinStatus = 'idle' | 'checking' | 'ok' | 'bad' | 'invalid';

type PromoDoc = {
  active?: boolean;
  label?: string;
  discountAmount?: number;      // flat per 1kg (scaled by total kg)
  discountPercentage?: number;  // % of subtotal
  minOrderAmount?: number;      // optional minimum subtotal
  maxDiscount?: number;         // cap for percentage promos
  validFrom?: string;
  validTo?: string;
};

type CartLine = {
  productId: 'modern' | 'traditional';
  name: string;
  image: string;
  unitPrice: number;
  qtyKg: number;             // 0.5, 1, ...
  mrp?: number | null;
  discountedPrice?: number | null;
};

const CART_KEY = 'cartItems';
const OLD_KEY = 'checkoutProduct';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, CornerBadgeComponent, FooterComponent],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  auth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);
  router: Router = inject(Router);

  isBrowser: boolean;

  user: User | null = null;
  uid: string = '';
  fullName: string = '';
  email: string = '';
  addresses: any[] = [];
  selectedAddressId: string = '';
  showAddressModal = false;
  loadingPayment = false;

  // --- CART ---
  cartItems: CartLine[] = [];
  subtotal = 0;
  totalAmount = 0;              // mutable (after promo)
  originalTotalAmount = 0;      // baseline (before promo)

  // === Quantity rules (kg) ===
  readonly MIN_QTY = 0.5;
  readonly STEP = 0.5;
  readonly MAX_QTY = 10;

  // promo
  promoApplied = false;
  promoCode: string = '';
  promoDiscountPercent: number = 0;
  promoDiscountAmount: number = 0;
  promoError: string = '';
  promoSuccess: string = '';
  isApplying = false;

  /** The exact promo that was applied (so we can re-run rules after cart changes) */
  private activePromo: PromoDoc | null = null;

  // PIN validation
  pincodeStatus: PinStatus = 'idle';
  private pincodeTimer: any = null;
  savingAddress = false;

  addressForm: any = {
    fullName: '',
    email: '',
    phoneNumber: '',
    addressLine: '',
    locality: '',
    pincode: '',
    city: '',
    state: '',
    isDefault: false,
    serviceable: null as boolean | null,
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;

    // --- MIGRATE old single-item checkout (backward compat)
    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      try {
        const o = JSON.parse(old);
        if (o?.productId && o?.product?.name && o?.unitPrice && o?.quantity) {
          const existing = this.readCart();
          existing.push({
            productId: o.productId,
            name: o.product.name,
            image: o.product.image,
            unitPrice: Number(o.unitPrice),
            qtyKg: Number(o.quantity),
            mrp: Number(o.mrp ?? o.price ?? -1) || null,
            discountedPrice: Number(o.discountedPrice ?? 0) || null,
          });
          this.writeCart(existing);
        }
      } catch {}
      localStorage.removeItem(OLD_KEY);
    }

    // Load cart
    this.cartItems = this.readCart().filter(it => it && it.unitPrice > 0 && it.qtyKg > 0);
    if (this.cartItems.length === 0) {
      this.router.navigate(['/products']);
      return;
    }
    this.recomputeTotalsFromCart();   // sets originalTotalAmount + totalAmount (no promo yet)

    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
      this.user = user;
      this.uid = user.uid;
      this.fullName = user.displayName || '';
      this.email = user.email || '';
      await this.loadAddresses();
      await this.loadRazorpayScript();
    });
  }

  // --- CART storage helpers
  private readCart(): CartLine[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  }
  private writeCart(lines: CartLine[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }

  /** Baseline totals (doesn't decide promo by itself). Call recomputePromo() after this if a promo is active. */
  private recomputeTotalsFromCart() {
    this.subtotal = this.cartItems.reduce((s, it) => s + it.unitPrice * it.qtyKg, 0);
    this.originalTotalAmount = Math.round(this.subtotal);
    this.totalAmount = this.originalTotalAmount;
  }

  totalQtyKg(): number {
    return this.cartItems.reduce((s, it) => s + it.qtyKg, 0);
  }

  // ===== Quantity helpers =====
  private roundToStep(n: number): number {
    return Math.round(n / this.STEP) * this.STEP;
  }

  incQty(index: number, delta: number) {
    const line = this.cartItems[index];
    if (!line) return;
    const next = this.roundToStep((line.qtyKg || this.MIN_QTY) + delta);
    this.updateQty(index, next);
  }

  onQtyInput(index: number, raw: string) {
    const val = Number(String(raw).replace(/[^0-9.]/g, ''));
    const next = isNaN(val) ? this.MIN_QTY : this.roundToStep(val);
    this.updateQty(index, next);
  }

  private updateQty(index: number, newQty: number) {
    newQty = Math.max(this.MIN_QTY, Math.min(this.MAX_QTY, newQty));
    newQty = Number(newQty.toFixed(1)); // snap

    const line = this.cartItems[index];
    if (!line) return;

    // treat below min as remove (not used now but safe-guard)
    if (newQty < this.MIN_QTY) {
      this.removeLine(index);
      return;
    }

    if (line.qtyKg === newQty) return;

    line.qtyKg = newQty;
    this.writeCart(this.cartItems);
    this.recomputeTotalsFromCart();
    this.recomputePromo(); // keep promo consistent
  }

  // --- Addresses
  async loadAddresses() {
    try {
      const addrCol = collection(this.firestore, `users/${this.uid}/addresses`);
      const addrSnap = await getDocs(addrCol);
      this.addresses = addrSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (this.addresses.length > 0 && !this.selectedAddressId) {
        this.selectedAddressId = this.addresses[0].id;
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  }
  openNewAddressModal() {
    this.addressForm = {
      fullName: '',
      email: this.email,
      phoneNumber: '',
      addressLine: '',
      locality: '',
      pincode: '',
      city: '',
      state: '',
      isDefault: false,
      serviceable: null,
    };
    this.pincodeStatus = 'idle';
    this.showAddressModal = true;
  }
  get selectedAddress() {
    return this.addresses.find(addr => addr.id === this.selectedAddressId) || null;
  }

  // ===== PINCODE LOOKUP =====
  onPincodeInput(val: string) {
    const pin = (val || '').replace(/\D/g, '').slice(0, 6);
    this.addressForm.pincode = pin;
    this.pincodeStatus = pin.length === 6 ? 'checking' : 'idle';
    if (this.pincodeTimer) clearTimeout(this.pincodeTimer);
    if (pin.length === 6) {
      this.pincodeTimer = setTimeout(() => this.lookupPincode(pin), 300);
    } else {
      this.addressForm.city = '';
      this.addressForm.state = '';
      this.addressForm.serviceable = null;
    }
  }
  onPincodeBlur() {
    if (this.addressForm.pincode && this.addressForm.pincode.length === 6 &&
        this.pincodeStatus !== 'ok' && this.pincodeStatus !== 'bad') {
      this.lookupPincode(this.addressForm.pincode);
    }
  }
  private async lookupPincode(pin: string) {
    this.pincodeStatus = 'checking';
    try {
      const res = await fetch(
        `https://us-central1-ekscoop-website.cloudfunctions.net/pincodeLookup?pin=${encodeURIComponent(pin)}`
      );
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      if (!data || data.ok !== true) {
        this.pincodeStatus = 'invalid';
        this.addressForm.city = '';
        this.addressForm.state = '';
        this.addressForm.serviceable = null;
        return;
      }
      this.addressForm.city = (data.city || '').toString().trim();
      this.addressForm.state = (data.state || '').toString().trim();
      this.addressForm.serviceable = !!data.serviceable;
      this.pincodeStatus = data.serviceable ? 'ok' : 'bad';
    } catch (e) {
      console.error('PIN lookup failed:', e);
      this.pincodeStatus = 'invalid';
      this.addressForm.city = '';
      this.addressForm.state = '';
      this.addressForm.serviceable = null;
    }
  }

  // ===== PROMO HELPERS =====
  private nowIso() { return new Date().toISOString(); }
  private isWithinWindow(p: PromoDoc): boolean {
    const now = new Date(this.nowIso()).getTime();
    const from = p.validFrom ? new Date(p.validFrom).getTime() : -Infinity;
    const to   = p.validTo   ? new Date(p.validTo).getTime()   :  Infinity;
    return now >= from && now <= to;
  }

  /** Quantity-aware (per 1kg) for flat; percent on subtotal; honors minOrderAmount & maxDiscount */
  private computeDiscount(subtotal: number, p: PromoDoc, totalQtyKg: number): number {
    if (p.minOrderAmount && subtotal < p.minOrderAmount) return 0;

    if (typeof p.discountAmount === 'number' && p.discountAmount > 0) {
      const raw = p.discountAmount * Math.max(0, totalQtyKg); // scale by total kg across cart
      return Math.min(Math.round(raw), Math.round(subtotal));
    }

    if (typeof p.discountPercentage === 'number' && p.discountPercentage > 0) {
      const raw = Math.floor(subtotal * (p.discountPercentage / 100));
      const capped =
        typeof p.maxDiscount === 'number' && p.maxDiscount > 0
          ? Math.min(raw, p.maxDiscount)
          : raw;
      return Math.min(capped, Math.round(subtotal));
    }
    return 0;
  }

  /** Re-evaluates the current promo against the latest cart. Auto-clears if invalid. */
  private recomputePromo() {
    if (!this.promoApplied || !this.activePromo) {
      this.totalAmount = this.originalTotalAmount;
      return;
    }
    const subtotal = this.originalTotalAmount;
    const qtyTotal = this.totalQtyKg();
    const newDiscount = this.computeDiscount(subtotal, this.activePromo, qtyTotal);

    if (newDiscount <= 0 || subtotal <= 0) {
      this.removePromo();
      return;
    }
    this.promoDiscountAmount = newDiscount;
    this.promoDiscountPercent = Math.round((newDiscount / Math.max(1, subtotal)) * 100);
    this.totalAmount = Math.max(0, subtotal - newDiscount);
  }

  // ===== PROMO (APPLY / REMOVE) =====
  async applyPromo() {
    if (this.isApplying) return;
    this.isApplying = true;

    this.promoError = '';
    this.promoSuccess = '';

    try {
      if (this.promoApplied) {
        this.promoError = 'A promo code is already applied. Remove it before applying another.';
        return;
      }

      const code = (this.promoCode || '').trim().toUpperCase();
      if (code.length < 3) {
        this.promoError = 'Enter a valid promo code.';
        return;
      }

      const promoRef = doc(this.firestore, `promocodes/${code}`);
      const promoSnap = await getDoc(promoRef);

      if (!promoSnap.exists()) {
        this.promoError = 'Invalid promo code. Please try again.';
        return;
      }

      const promo = (promoSnap.data() as PromoDoc) || {};
      if (promo.active !== true) {
        this.promoError = 'This promo code is inactive.';
        return;
      }

      if (!this.isWithinWindow(promo)) {
        this.promoError = 'This promo code is not valid at this time.';
        return;
      }

      const subtotal = this.originalTotalAmount;
      const qtyTotal = this.totalQtyKg();
      const discount = this.computeDiscount(subtotal, promo, qtyTotal);

      if (discount <= 0) {
        this.promoError = 'Promo found but no discount applicable.';
        return;
      }

      // save + apply
      this.activePromo = promo;
      this.promoApplied = true;
      this.promoDiscountAmount = discount;
      this.promoDiscountPercent = Math.round((discount / Math.max(1, subtotal)) * 100);
      this.totalAmount = Math.max(0, subtotal - discount);

      const label = promo.label ? ` (${promo.label})` : '';
      this.promoSuccess = `Promo applied${label}! You saved ₹${discount}.`;

    } catch (err) {
      console.error('Error applying promo:', err);
      this.promoError = 'Something went wrong applying promo. Try again.';
    } finally {
      this.isApplying = false;
    }
  }

  removePromo() {
    if (!this.promoApplied) {
      this.promoError = 'No promo applied to remove.';
      this.totalAmount = this.originalTotalAmount;
      return;
    }
    this.promoApplied = false;
    this.activePromo = null;
    this.promoDiscountAmount = 0;
    this.promoDiscountPercent = 0;
    this.promoCode = '';
    this.promoSuccess = '';
    this.promoError = '';
    this.totalAmount = this.originalTotalAmount;
  }

  // ===== SAVE ADDRESS =====
  async saveAddress() {
    if (!this.addressForm.pincode || this.addressForm.pincode.length !== 6) {
      alert('Please enter a valid 6-digit pincode.');
      return;
    }
    if (this.pincodeStatus !== 'ok' || this.addressForm.serviceable !== true) {
      alert('This pincode is not serviceable. Please use a different address.');
      return;
    }
    if (!this.addressForm.city || !this.addressForm.state) {
      alert('Please fill City and State.');
      return;
    }

    this.savingAddress = true;
    try {
      const addrCol = collection(this.firestore, `users/${this.uid}/addresses`);
      await addDoc(addrCol, {
        ...this.addressForm,
        city: this.addressForm.city || '',
        state: this.addressForm.state || '',
        serviceable: true,
      });
      this.showAddressModal = false;
      await this.loadAddresses();
    } catch (error) {
      console.error('Failed to save address:', error);
      alert('Failed to save address. Please try again.');
    } finally {
      this.savingAddress = false;
    }
  }

  // ===== PAYMENT =====
  async placeOrder() {
    if (!this.selectedAddress) {
      alert('Please select a delivery address first!');
      return;
    }
    if (this.selectedAddress.serviceable === false) {
      alert('Selected address pincode is not serviceable. Please choose another address.');
      return;
    }
    if (this.cartItems.length === 0) {
      alert('Your cart is empty.');
      this.router.navigate(['/products']);
      return;
    }

    this.loadingPayment = true;

    try {
      // Backward compatible payload: send both items[] and legacy single fields (first line)
      const first = this.cartItems[0];
      const response = await fetch('https://us-central1-ekscoop-website.cloudfunctions.net/createRazorpayOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.promoApplied && this.promoCode
            ? { 'x-promo-code': this.promoCode.trim().toUpperCase() }
            : {}),
        },
        body: JSON.stringify({
          items: this.cartItems.map(it => ({
            productId: it.productId,
            qtyKg: it.qtyKg,
          })),
          productId: first.productId, // legacy
          quantity: first.qtyKg,      // legacy
        }),
      });

      const result = await response.json();

      if (result?.order?.id) {
        const { order, promo } = result;

        // Server truth for final amount
        this.totalAmount = order.amount / 100;

        if (promo) {
          this.promoDiscountPercent = promo.discountPercent || 0;
          this.promoDiscountAmount = promo.discountAmount || 0;
          if (this.promoDiscountAmount > 0) {
            this.promoSuccess = `Promo applied! You saved ₹${this.promoDiscountAmount}.`;
            this.promoApplied = true;
          }
        }

        this.openRazorpay(order);
      } else {
        alert(result?.error || 'Failed to create payment order. Please try again.');
        this.loadingPayment = false;
      }
    } catch (error) {
      alert('Payment initiation failed. Please try again.');
      this.loadingPayment = false;
    }
  }

  async openRazorpay(order: any) {
    if (typeof Razorpay === 'undefined') {
      alert('Payment gateway failed to load. Please refresh the page or check your internet connection.');
      this.loadingPayment = false;
      return;
    }

    const options = {
      key: 'rzp_live_REDs7iq8XucX6d',
      amount: order.amount,
      currency: order.currency,
      name: 'ekScoop',
      description: 'Protein Sachets Order',
      notes: {
        cart_summary: this.cartItems.map(it => `${it.productId}:${it.qtyKg}kg`).join(', '),
        shipping_name: this.fullName,
        shipping_email: this.selectedAddress.email,
        shipping_phone: this.selectedAddress.phoneNumber,
        shipping_address: `${this.selectedAddress.addressLine},${this.selectedAddress.locality}, ${this.selectedAddress.city},  ${this.selectedAddress.state}, ${this.selectedAddress.pincode}`,
      },
      image: 'https://ekscoop.com/assets/favicon/android-chrome-192x192.png',
      order_id: order.id,
      theme: { color: '#ff6600' },
      handler: async (response: any) => {
        const orderData = {
          uid: this.uid,
          razorpayOrderId: order.id,
          razorpayPaymentId: response.razorpay_payment_id,
          paymentStatus: 'paid',
          paidAt: new Date(),
          amount: order.amount / 100,
          finalAmount: this.totalAmount,
          promoCodeUsed: this.promoApplied ? (this.promoCode || null) : null,
          promoDiscountPercent: this.promoDiscountPercent,
          promoDiscountAmount: this.promoDiscountAmount,
          currency: order.currency,
          selectedAddress: this.selectedAddress,
          customer: {
            name: this.fullName,
            email: this.email,
            phone: this.selectedAddress.phoneNumber,
          },
          products: this.cartItems.map(it => ({
            name: it.name,
            image: it.image,
            quantityKg: it.qtyKg,
            unitPrice: it.unitPrice,
            lineTotal: Math.round(it.unitPrice * it.qtyKg),
            productId: it.productId,
          })),
        };

        try {
          const userOrderRef = doc(this.firestore, `users/${this.uid}/orders/${order.id}`);
          const adminOrderRef = doc(this.firestore, `orders/${order.id}`);
          await setDoc(userOrderRef, orderData);
          await setDoc(adminOrderRef, orderData);

          if (this.promoApplied && this.promoCode) {
            const promoUsageRef = doc(this.firestore, `promocode_usages/${order.id}`);
            await setDoc(promoUsageRef, {
              promoCode: this.promoCode.toUpperCase(),
              discountPercent: this.promoDiscountPercent,
              discountAmount: this.promoDiscountAmount,
              userId: this.uid,
              userName: this.fullName,
              userEmail: this.email,
              orderId: order.id,
              finalAmount: this.totalAmount,
              paidAt: new Date().toISOString(),
              orderDetails: {
                products: orderData.products,
                selectedAddress: this.selectedAddress,
              },
            });
          }

          // ✅ clear cart only after success
          localStorage.removeItem(CART_KEY);

          alert('Payment successful & order saved!');
          this.loadingPayment = false;
          this.router.navigate(['/orders']);
        } catch (error) {
          alert('Payment succeeded, but failed to save order. Contact support.');
          this.loadingPayment = false;
        }
      },
      prefill: {
        name: this.fullName,
        contact: this.selectedAddress?.phoneNumber,
        email: this.email,
      },
      modal: {
        ondismiss: () => {
          this.loadingPayment = false;
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
    rzp.on('payment.failed', () => {
      this.loadingPayment = false;
    });
  }

  async loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('Failed to load Razorpay SDK.');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  // ===== CART MUTATION =====
  removeLine(index: number) {
    this.cartItems.splice(index, 1);
    this.writeCart(this.cartItems);

    if (this.cartItems.length === 0) {
      if (this.promoApplied) this.removePromo();
      this.router.navigate(['/products']);
      return;
    }

    this.recomputeTotalsFromCart();
    this.recomputePromo();
  }
}
