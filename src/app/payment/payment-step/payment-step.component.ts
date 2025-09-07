import { Component, EventEmitter, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../services/cart.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
declare var Razorpay: any;

@Component({
  selector: 'app-payment-step',
  imports:[FormsModule,CommonModule],
  templateUrl: './payment-step.component.html',
  styleUrls: ['./payment-step.component.css'],
})
export class PaymentStepComponent {
  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  phone = '93813 47533';
  address = 'A281, Sector MU 1, Gautam Budh Nagar, UP';

  promoCode: string = '';
  promoApplied = false;
  discount = 0;

  selectedMethod: string = '';

  paymentMethods = [
    { id: 'cards', name: 'Credit/Debit Cards', desc: 'Visa, MasterCard, RuPay accepted' },
    { id: 'netbanking', name: 'Net Banking', desc: 'All major banks supported' },
    { id: 'wallet', name: 'Digital Wallets', desc: 'PayTM, PhonePe, GPay' },
    { id: 'paylater', name: 'Pay Later', desc: 'Flexible payment options' },
  ];

  constructor(
    public cart: CartService,
    private http: HttpClient
  ) {}

  get subtotal(): number {
    return this.cart.getTotalAmount();
  }

  get totalAmount(): number {
    return this.subtotal - this.discount;
  }

  selectMethod(methodId: string): void {
    this.selectedMethod = methodId;
  }

  applyPromoCode(): void {
    if (this.promoCode.toLowerCase() === 'ekscoop10') {
      this.discount = this.subtotal * 0.1;
      this.promoApplied = true;
    } else {
      this.discount = 0;
      this.promoApplied = false;
      alert('Invalid promo code.');
    }
  }

  continue(): void {
    if (!this.selectedMethod) {
      alert('Please select a payment method.');
      return;
    }

    if (this.totalAmount <= 0) {
      alert('Invalid total amount.');
      return;
    }

    this.http.post<any>(
      'https://us-central1-ekscoop-website.cloudfunctions.net/createRazorpayOrder',
      { amount: this.totalAmount },
      { headers: { 'Content-Type': 'application/json' } }
    ).subscribe({
      next: (order) => {
        if (order && order.id) {
          this.openRazorpay(order);
        } else {
          alert('Failed to create payment order. Please try again.');
        }
      },
      error: (err) => {
        console.error('Error creating Razorpay order:', err);
        alert('Payment initiation failed. Please try again.');
      }
    });
  }

  openRazorpay(order: any): void {
    const options = {
      key: 'rzp_live_REDs7iq8XucX6d', // ✅ Replace with live/test key
      amount: order.amount,
      currency: order.currency,
      name: 'ekScoop',
      description: 'Protein Sachets Order',
      image: 'https://yourbrand.com/logo.png', // ✅ Replace with your logo URL
      order_id: order.id,
      theme: {
        color: '#ff6600',
      },
      handler: (response: any) => {
        console.log('Payment successful!', response);
        alert('Payment successful!');
        this.next.emit(); // ✅ Notify parent to move to confirmation step
      },
      prefill: {
        name: 'ekScoop Customer',
        contact: this.phone,
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  goBack(): void {
    this.back.emit();
  }
}
