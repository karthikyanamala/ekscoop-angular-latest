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

  productId: string = '';
  product = { name: '', image: '' };
  quantity = 1;
  unitPrice = 0;
  totalAmount = 0;
  originalTotalAmount = 0;
  promoApplied = false;

  promoCode: string = '';
  promoDiscountPercent: number = 0;
  promoDiscountAmount: number = 0;
  promoInfluencerName: string = '';
  promoError: string = '';
  promoSuccess: string = '';

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
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;

    const storedProduct = localStorage.getItem('checkoutProduct');
    if (storedProduct) {
      try {
        const parsed = JSON.parse(storedProduct);
        if (parsed.productId && parsed.product && parsed.quantity) {
          this.product = parsed.product;
          this.productId = parsed.productId;
          this.quantity = parsed.quantity;
          this.unitPrice = parsed.unitPrice;
          this.totalAmount = this.unitPrice * this.quantity;
          this.originalTotalAmount = this.totalAmount;
        } else {
          this.router.navigate(['/home']);
          return;
        }
      } catch (err) {
        this.router.navigate(['/home']);
        return;
      }
    } else {
      this.router.navigate(['/home']);
      return;
    }

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

  async loadAddresses() {
    if (!this.isBrowser) return;

    try {
      console.log('[QuestionDetailComponent54321234] Fetching answers...');
      const addrCol = collection(this.firestore, `users/${this.uid}/addresses`);
      const addrSnap = await getDocs(addrCol);
      this.addresses = addrSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    };
    this.showAddressModal = true;
  }

  async saveAddress() {
    if (!this.isBrowser) return;

    try {
      console.log('[QuestionDetailComponent345634] Fetching answers...');
      const addrCol = collection(this.firestore, `users/${this.uid}/addresses`);
      await addDoc(addrCol, this.addressForm);
      this.showAddressModal = false;
      await this.loadAddresses();
    } catch (error) {
      console.error('Failed to save address:', error);
    }
  }

  get selectedAddress() {
    return this.addresses.find(addr => addr.id === this.selectedAddressId) || null;
  }

  async applyPromo() {
    if (!this.isBrowser) return;

    this.promoError = '';
    this.promoSuccess = '';

    if (this.promoApplied) {
      this.promoError = 'A promo is already applied. Remove it first to apply another.';
      return;
    }

    if (!this.promoCode || this.promoCode.trim().length < 3) {
      this.promoError = 'Enter a valid promo code.';
      return;
    }

    try {
      const promoRef = doc(this.firestore, `promocodes/${this.promoCode.toUpperCase()}`);
      const promoSnap = await getDoc(promoRef);

      if (!promoSnap.exists()) {
        this.promoError = 'Invalid promo code. Please try again.';
        return;
      }

      const promoData = promoSnap.data();
      if (!promoData || promoData['active'] !== true) {
        this.promoError = 'This promo code is inactive.';
        return;
      }

      if (typeof promoData['discountPercentage'] === 'number') {
        this.promoDiscountPercent = promoData['discountPercentage'];
        this.promoDiscountAmount = Math.floor(this.totalAmount * (this.promoDiscountPercent / 100));
        this.totalAmount = this.totalAmount - this.promoDiscountAmount;
        this.promoInfluencerName = promoData['influencerName'] ?? 'Unknown';

        this.promoSuccess = `Promo applied! You saved ₹${this.promoDiscountAmount}. Influencer: ${this.promoInfluencerName}`;
        this.promoApplied = true;
      } else {
        this.promoError = 'Promo found but invalid discount percentage.';
      }
    } catch (error) {
      console.error('Error applying promo:', error);
      this.promoError = 'Something went wrong applying promo. Try again.';
    }
  }

  removePromo() {
    if (!this.promoApplied) {
      this.promoError = 'No promo applied to remove.';
      return;
    }

    this.totalAmount = this.originalTotalAmount;
    this.promoCode = '';
    this.promoDiscountPercent = 0;
    this.promoDiscountAmount = 0;
    this.promoApplied = false;
    this.promoSuccess = '';
    this.promoError = '';
  }

  async placeOrder() {
    if (!this.isBrowser || !this.selectedAddress) {
      alert('Please select a delivery address first!');
      return;
    }

    this.loadingPayment = true;

    try {
      const response = await fetch('https://us-central1-ekscoop-website.cloudfunctions.net/createRazorpayOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.promoApplied && this.promoCode
            ? { 'x-promo-code': this.promoCode.trim().toUpperCase() }
            : {}),
        },
        body: JSON.stringify({
          productId: this.productId,
          quantity: this.quantity,
        }),
      });

      const result = await response.json();

      if (result?.order?.id) {
        const { order, promo } = result;

        this.unitPrice = (order.amount / 100) / this.quantity;
        this.totalAmount = order.amount / 100;

        if (promo) {
          this.promoDiscountPercent = promo.discountPercent;
          this.promoDiscountAmount = promo.discountAmount;
          this.promoInfluencerName = promo.influencerName;
          this.promoSuccess = `Promo applied! You saved ₹${promo.discountAmount}. Influencer: ${promo.influencerName}`;
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
    if (!this.isBrowser || typeof Razorpay === 'undefined') {
      alert('Payment gateway failed to load. Please refresh the page or check your internet connection.');
      this.loadingPayment = false;
      return;
    }

    const options = {
      key: 'rzp_test_w83QYksMRrJXUy',
      amount: order.amount,
      currency: order.currency,
      name: 'ekScoop',
      description: 'Protein Sachets Order',
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
          promoCodeUsed: this.promoCode || null,
          promoDiscountPercent: this.promoDiscountPercent,
          promoDiscountAmount: this.promoDiscountAmount,
          currency: order.currency,
          selectedAddress: this.selectedAddress,
          customer: {
            name: this.fullName,
            email: this.email,
            phone: this.selectedAddress.phoneNumber,
          },
          products: [
            {
              name: this.product.name,
              image: this.product.image,
              quantity: this.quantity,
              unitPrice: this.unitPrice,
            },
          ],
        };

        try {
          const userOrderRef = doc(this.firestore, `users/${this.uid}/orders/${order.id}`);
          const adminOrderRef = doc(this.firestore, `orders/${order.id}`);
          await setDoc(userOrderRef, orderData);
          await setDoc(adminOrderRef, orderData);

          if (this.promoApplied && this.promoCode) {
            const usageData = {
              promoCode: this.promoCode.toUpperCase(),
              discountPercent: this.promoDiscountPercent,
              discountAmount: this.promoDiscountAmount,
              influencerName: this.promoInfluencerName || 'Unknown',
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
            };

            const promoUsageRef = doc(this.firestore, `promocode_usages/${order.id}`);
            await setDoc(promoUsageRef, usageData);
          }

          alert('Payment successful & order saved!');
          this.loadingPayment = false;
          this.router.navigate(['/order-success']);
        } catch (error) {
          alert('Payment succeeded, but failed to save order. Contact support.');
          this.loadingPayment = false;
        }
      },
      prefill: {
        name: this.fullName,
        contact: this.selectedAddress.phoneNumber,
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
    if (!this.isBrowser) return false;

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
}
