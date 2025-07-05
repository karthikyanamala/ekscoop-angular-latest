import { Component, ViewContainerRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthPopupComponent } from '../../payment/auth-popup/auth-popup.component';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

type VariantKey = 'traditional' | 'modern';

type VariantData = {
  name: string;
  image: string;
  description: string;
  features: string[];
  price: number;
};

@Component({
  selector: 'app-product-showcase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-showcase.component.html',
  styleUrls: ['./product-showcase.component.css'],
})
export class ProductShowcaseComponent implements OnInit {
  selectedVariant: VariantKey | '' = '';
  quantity = 1;
  unitPrice = -1; // -1 to clearly show when price isn't loaded

  variants: Record<VariantKey, VariantData> = {
    traditional: {
      name: 'Traditional Design',
      image: 'assets/traditional.png',
      description: 'Perfect for traditional Indian meals',
      features: ['Add to roti dough', 'Stir into dal', 'Mix with poha'],
      price: -1,
    },
    modern: {
      name: 'Active Lifestyle',
      image: 'assets/modern.png',
      description: 'Designed for active individuals',
      features: ['Feel stronger daily', 'Feel active', '16.7g protein'],
      price: -1,
    },
  };

  constructor(
    private viewContainerRef: ViewContainerRef,
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    this.loadPrices();
  }

  async loadPrices() {
    try {
      const traditionalSnap = await getDoc(doc(this.firestore, 'products/traditional'));
      const modernSnap = await getDoc(doc(this.firestore, 'products/modren'));

      if (traditionalSnap.exists()) {
        const data = traditionalSnap.data() as { price?: number };
        if (typeof data.price === 'number' && data.price > 0) {
          this.variants.traditional.price = data.price;
        } else {
          console.error('Invalid price for traditional variant:', data.price);
          alert('Error loading price for Traditional variant. Please try again later.');
        }
      } else {
        console.error('Traditional variant document not found in Firestore.');
        alert('Traditional variant not found. Please try again later.');
      }

      if (modernSnap.exists()) {
        const data = modernSnap.data() as { price?: number };
        if (typeof data.price === 'number' && data.price > 0) {
          this.variants.modern.price = data.price;
        } else {
          console.error('Invalid price for modern variant:', data.price);
          alert('Error loading price for Modern variant. Please try again later.');
        }
      } else {
        console.error('Modern variant document not found in Firestore.');
        alert('Modern variant not found. Please try again later.');
      }
    } catch (error) {
      console.error('Error loading prices from Firestore:', error);
      alert('Could not load product prices. Please check your connection or try again later.');
    }
  }

  selectVariant(variant: string) {
    if (variant === 'traditional' || variant === 'modern') {
      this.selectedVariant = variant as VariantKey;
      const selectedPrice = this.variants[this.selectedVariant].price;
      if (selectedPrice > 0) {
        this.unitPrice = selectedPrice;
      } else {
        alert('Error: Price unavailable for selected variant.');
        this.unitPrice = -1;
      }
    }
  }

  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) this.quantity--;
  }

  get calculatedPrice(): number {
    return this.unitPrice > 0 ? this.unitPrice * this.quantity : 0;
  }

  async handleBuyNow() {
    if (!this.selectedVariant) {
      alert('Please select a variant first.');
      return;
    }
    if (this.unitPrice <= 0) {
      alert('Cannot place order: Price unavailable.');
      return;
    }

    const variantData = this.selectedVariantData;
    if (!variantData) return;

    const currentUser = await firstValueFrom(this.authService.getCurrentUser());
    if (!currentUser) {
      this.showLoginPopup();
      return;
    }

    localStorage.setItem(
      'checkoutProduct',
      JSON.stringify({
        productId: this.selectedVariant, // ✅ important for checkout flow
        product: {
          name: variantData.name,
          image: variantData.image,
        },
        quantity: this.quantity,
        unitPrice: this.unitPrice,
       
      })
    );
     console.log(this.unitPrice)
    this.router.navigate(['/checkout']);
  }

  showLoginPopup() {
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(AuthPopupComponent);

    const onAuthSuccess = () => {
      this.viewContainerRef.clear();
      window.removeEventListener('auth-success', onAuthSuccess);
      alert('Login successful! Continue with your purchase.');
      this.handleBuyNow();
    };

    window.addEventListener('auth-success', onAuthSuccess);
  }

  get selectedVariantData() {
    return this.selectedVariant ? this.variants[this.selectedVariant] : null;
  }
}
