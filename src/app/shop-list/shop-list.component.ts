import { Component, OnInit } from '@angular/core';
import { Shop } from '../model/shop.model';
import { ShopService } from "../services/shop.service";
import { LocationService } from '../services/location.service';
import { CommonModule } from '@angular/common';       // Provides *ngFor, *ngIf, etc.
import { FormsModule } from '@angular/forms'; 
import { NgSelectModule } from '@ng-select/ng-select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon'; 
@Component({
  selector: 'app-shop-list',
  standalone: true,
  imports: [CommonModule, FormsModule,MatFormFieldModule,MatSelectModule,MatIconModule],
  templateUrl: './shop-list.component.html',
  styleUrls: ['./shop-list.component.scss']
})
export class ShopListComponent implements OnInit {
  allShops: Shop[] = [];
  filteredShops: Shop[] = [];
  selectedProduct: string = '';
  userCoords: { lat: number; lng: number } | null = null;
  searchRadius = 20;

  constructor(private shopService: ShopService, private locationService: LocationService) {}

  ngOnInit(): void {
    this.shopService.getShops().subscribe((data: Shop[]) => {
      this.allShops = data;
      this.getUserLocation();
    });
  }

  async getUserLocation() {
    try {
      this.userCoords = await this.locationService.getCurrentLocation();
      this.applyFilters();
    } catch (err) {
      console.warn('Location access denied. Showing all shops.');
      this.filteredShops = this.allShops;
    }
  }

  applyFilters() {
    this.filteredShops = this.allShops.filter(shop => {
      const isProductMatch = !this.selectedProduct || shop.products.includes(this.selectedProduct);
      const isInRadius =
        this.userCoords &&
        this.locationService.getDistance(
          this.userCoords.lat,
          this.userCoords.lng,
          shop.latitude,
          shop.longitude
        ) <= this.searchRadius;
      return isProductMatch && (!this.userCoords || isInRadius);
    });
  }

  getWhatsAppLink(shop: Shop, product: string): string {
    const message = `Hi, I want to order ${product} from your shop.`;
    return `https://wa.me/${shop.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  getMapLink(shop: Shop): string {
    return `https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`;
  }

  getAllProducts(): string[] {
    return [...new Set(this.allShops.flatMap(shop => shop.products))];
  }
  getUniqueProducts(): string[] {
    const allProducts = this.allShops.flatMap(shop => shop.products);
    const seen = new Set<string>();
  
    // Normalize and deduplicate, while preserving original casing
    const uniqueProducts = allProducts.filter(product => {
      const key = product.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  
    return uniqueProducts.filter(Boolean); // removes undefined if any
  }
  
}
