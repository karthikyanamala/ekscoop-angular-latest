// // src/app/services/cart.service.ts
// import { Injectable } from '@angular/core';

// export interface CartItem {
//   id: string;
//   name: string;
//   price: number;
//   originalPrice: number;
//   weight: '1kg' | '2kg';
//   sachets: number;
//   quantity: number;
//   image: string;
// }

// @Injectable({ providedIn: 'root' })
// export class CartService {
//   items: CartItem[] = [];

//   constructor() {
//     this.loadCartFromLocalStorage(); // 🔥 Load cart on service initialization
//   }

//   get total(): number {
//     return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
//   }

//   get itemCount(): number {
//     return this.items.reduce((sum, item) => sum + item.quantity, 0);
//   }

//   addItem(item: CartItem) {
//     const existing = this.items.find(i => i.id === item.id);
//     if (existing) {
//       existing.quantity += item.quantity;
//     } else {
//       this.items.push(item);
//     }
//     this.saveCartToLocalStorage(); // ✅ Save updated cart
//   }

//   updateQuantity(id: string, quantity: number) {
//     const item = this.items.find(i => i.id === id);
//     if (item && quantity > 0) {
//       item.quantity = quantity;
//       this.saveCartToLocalStorage(); // ✅ Save updated cart
//     }
//   }

//   removeItem(id: string) {
//     this.items = this.items.filter(i => i.id !== id);
//     this.saveCartToLocalStorage(); // ✅ Save updated cart
//   }

//   clearCart() {
//     this.items = [];
//     this.saveCartToLocalStorage(); // ✅ Save cleared cart
//   }

//   getItems() {
//     return [...this.items];
//   }

//   getTotalAmount(): number {
//     return this.getItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
//   }

//   // 🔥🔥🔥 NEW METHODS BELOW 🔥🔥🔥

//   private saveCartToLocalStorage() {
//     localStorage.setItem('cart', JSON.stringify(this.items));
//   }

//   private loadCartFromLocalStorage() {
//     const storedCart = localStorage.getItem('cart');
//     if (storedCart) {
//       try {
//         this.items = JSON.parse(storedCart);
//       } catch (e) {
//         console.error('Failed to parse cart from localStorage', e);
//         this.items = [];
//       }
//     }
//   }
// }
// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  weight: '1kg' | '2kg';
  sachets: number;
  quantity: number;
  image: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  items: CartItem[] = [];

  // 👇 add these
  uid: string | null = null;
  selectedAddressId: string | null = null;

  constructor() {
    this.loadCartFromLocalStorage();
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  addItem(item: CartItem) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) existing.quantity += item.quantity;
    else this.items.push(item);
    this.saveCartToLocalStorage();
  }

  updateQuantity(id: string, quantity: number) {
    const item = this.items.find(i => i.id === id);
    if (item && quantity > 0) {
      item.quantity = quantity;
      this.saveCartToLocalStorage();
    }
  }

  removeItem(id: string) {
    this.items = this.items.filter(i => i.id !== id);
    this.saveCartToLocalStorage();
  }

  clearCart() {
    this.items = [];
    this.saveCartToLocalStorage();
  }

  getItems() {
    return [...this.items];
  }

  getTotalAmount(): number {
    return this.getItems().reduce((s, i) => s + i.price * i.quantity, 0);
  }

  // 🔹 setters to be called by your auth/address UI
  setUid(uid: string) { this.uid = uid; }
  setSelectedAddressId(addrId: string) { this.selectedAddressId = addrId; }

  // 🔹 if your checkout supports only one product for now
  getPrimaryItem(): CartItem | undefined {
    return this.items[0];
  }

  private saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(this.items));
  }

  private loadCartFromLocalStorage() {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try { this.items = JSON.parse(stored) as CartItem[]; }
      catch { this.items = []; }
    }
  }
}
