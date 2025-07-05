import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, collection, getDocs, addDoc, doc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
declare var Razorpay: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  auth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);
  router: Router = inject(Router);

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

  ngOnInit() {
    // ✅ Read product info from localStorage
    const storedProduct = localStorage.getItem('checkoutProduct');
    if (storedProduct) {
      try {
        const parsed = JSON.parse(storedProduct);
        if (parsed.productId && parsed.product && parsed.quantity) {
          this.product = parsed.product;
          this.productId = parsed.productId;
          this.quantity = parsed.quantity;
          this.totalAmount = parsed.unitPrice * this.quantity;
          // unitPrice will be updated on server response
        } else {
          console.warn('Incomplete product data:', parsed);
          this.router.navigate(['/home']);
          return;
        }
      } catch (err) {
        console.error('Failed to parse checkout product data:', err);
        this.router.navigate(['/home']);
        return;
      }
    } else {
      console.warn('No checkout product found.');
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
    try {
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
    try {
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

  async placeOrder() {
    if (!this.selectedAddress) {
      alert('Please select a delivery address first!');
      return;
    }

    this.loadingPayment = true;

    try {
      const response = await fetch('https://us-central1-ekscoop-website.cloudfunctions.net/createRazorpayOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: this.productId,
          quantity: this.quantity,
        }),
      });

      const order = await response.json();

      if (order && order.id) {
        // ✅ Update price from server response before payment popup
        this.unitPrice = (order.amount / 100) / this.quantity;
        this.totalAmount = order.amount / 100;

        this.openRazorpay(order);
      } else {
        console.error('Invalid response from server:', order);
        alert('Failed to create payment order. Please try again.');
        this.loadingPayment = false;
      }
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
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
      key: 'rzp_test_w83QYksMRrJXUy',
      amount: order.amount,
      currency: order.currency,
      name: 'ekScoop',
      description: 'Protein Sachets Order',
      image: 'https://yourbrand.com/logo.png',
      order_id: order.id,
      theme: { color: '#ff6600' },
      handler: async (response: any) => {
        console.log('Payment successful!', response);

        const orderData = {
          uid: this.uid,
          razorpayOrderId: order.id,
          razorpayPaymentId: response.razorpay_payment_id,
          paymentStatus: 'paid',
          paidAt: new Date(),
          amount: order.amount / 100,
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
          await setDoc(userOrderRef, orderData);

          const adminOrderRef = doc(this.firestore, `orders/${order.id}`);
          await setDoc(adminOrderRef, orderData);

          alert('Payment successful & order saved!');
          this.loadingPayment = false;
          this.router.navigate(['/order-success']);
        } catch (error) {
          console.error('Failed to save order details:', error);
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
          console.log('Payment popup closed by user.');
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

  async loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof Razorpay !== 'undefined') {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Razorpay script failed to load.'));
      document.body.appendChild(script);
    });
  }
}
