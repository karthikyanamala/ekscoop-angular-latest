import { Component, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
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
  gallery: string[];
};

@Component({
  selector: 'app-product-showcase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-showcase.component.html',
  styleUrls: ['./product-showcase.component.css'],
})
export class ProductShowcaseComponent implements OnInit, OnDestroy {
  selectedVariant: VariantKey | '' = '';
  quantity = 1;
  unitPrice = -1;

  selectedImage: string = '';

  isPaused = false;
  interval: any;
  currentSlide = 0;

  carouselImages: string[] = [
    'assets/traditional.png',
    'assets/modern.png',
    'assets/gym-mode.png'
  ];

  variants: Record<VariantKey, VariantData> = {
    traditional: {
      name: 'Traditional Design',
      image: 'assets/traditional.png',
      description: 'Perfect for traditional Indian meals',
      features: ['Add to roti dough', 'Stir into dal', 'Mix with poha'],
      price: -1,
      gallery: [
        'assets/traditional.png',
        'assets/family-mode.png',
        'assets/feminine-mode.png'
      ]
    },
    modern: {
      name: 'Active Lifestyle',
      image: 'assets/modern.png',
      description: 'Designed for active individuals',
      features: ['Feel stronger daily', 'Feel active', '16.7g protein'],
      price: -1,
      gallery: [
        'assets/modern.png',
        'assets/gym-mode.png',
        'assets/health-mode.png',
        
      ]
    }
  };

  constructor(
    private viewContainerRef: ViewContainerRef,
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    this.loadPrices();
    this.startCarousel();
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  async loadPrices() {
    try {
      const traditionalSnap = await getDoc(doc(this.firestore, 'products/traditional'));
      const modernSnap = await getDoc(doc(this.firestore, 'products/modern'));

      if (traditionalSnap.exists()) {
        const data = traditionalSnap.data() as { price?: number };
        this.variants.traditional.price = data.price ?? -1;
      }

      if (modernSnap.exists()) {
        const data = modernSnap.data() as { price?: number };
        this.variants.modern.price = data.price ?? -1;
      }
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  }

  selectVariant(variant: string) {
    if (variant === 'traditional' || variant === 'modern') {
      this.selectedVariant = variant as VariantKey;
      const selected = this.variants[this.selectedVariant];
      this.unitPrice = selected.price > 0 ? selected.price : -1;
      this.selectedImage = selected.gallery[0];
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
      alert('Price unavailable.');
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
        productId: this.selectedVariant,
        product: {
          name: variantData.name,
          image: variantData.image,
        },
        quantity: this.quantity,
        unitPrice: this.unitPrice,
      })
    );
    this.router.navigate(['/checkout']);
  }

  showLoginPopup() {
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(AuthPopupComponent);
    const onAuthSuccess = () => {
      this.viewContainerRef.clear();
      window.removeEventListener('auth-success', onAuthSuccess);
      alert('Login successful!');
      this.handleBuyNow();
    };
    window.addEventListener('auth-success', onAuthSuccess);
  }

  get selectedVariantData() {
    return this.selectedVariant ? this.variants[this.selectedVariant] : null;
  }

  toggleCarousel() {
    this.isPaused = !this.isPaused;
  }

  startCarousel() {
    this.interval = setInterval(() => {
      if (!this.isPaused && !this.selectedVariant) {
        this.currentSlide = (this.currentSlide + 1) % this.carouselImages.length;
      }
    }, 3000);
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  selectGalleryImage(image: string) {
    this.selectedImage = image;
  }
}
