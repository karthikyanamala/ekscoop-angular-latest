import { Component, OnInit } from '@angular/core';
import { Shop } from '../model/shop.model';
import { ShopService } from '../services/shop.service';
import { LocationService } from '../services/location.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { EkscoopLoaderComponent } from '../ekscoop-loader/ekscoop-loader.component';

@Component({
  selector: 'app-shop-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatIconModule, EkscoopLoaderComponent],
  templateUrl: './shop-list.component.html',
  styleUrls: ['./shop-list.component.scss']
})
export class ShopListComponent implements OnInit {
  filteredShops: Shop[] = [];
  selectedProduct: string = '';
  userCoords: { lat: number; lng: number } | null = null;
  searchRadius = 3;
  isLoadingLocation = false;
  isLoadingShops = false;
  locationDenied = false;

  constructor(private shopService: ShopService, public locationService: LocationService) {}

  ngOnInit(): void {
    this.getUserLocation();
  }

  async getUserLocation() {
    this.isLoadingLocation = true;
    try {
      this.userCoords = await this.locationService.getCurrentLocation();
      this.locationDenied = false;
      await this.loadNearbyShops();
    } catch (err: any) {
      this.filteredShops = [];
      this.locationDenied = err.code === 1;
      console.warn('Location access denied.');
    } finally {
      this.isLoadingLocation = false;
    }
  }

  async loadNearbyShops() {
    if (!this.userCoords) return;

    this.isLoadingShops = true;
    try {
      const shops = await this.shopService.getShopsNearby(
        this.userCoords.lat,
        this.userCoords.lng,
        this.searchRadius
      );

      // Filter by product if needed
      this.filteredShops = shops.filter(shop =>
        !this.selectedProduct || shop.products.includes(this.selectedProduct)
      );
    } catch (error) {
      console.error('Error loading shops:', error);
      this.filteredShops = [];
    } finally {
      this.isLoadingShops = false;
    }
  }

  getWhatsAppLink(shop: Shop, product: string): string {
    const message = `Hi, I want to order ${product} from your shop.`;
    return `https://wa.me/${shop.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  getMapLink(shop: Shop): string {
    return `https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`;
  }

  getUniqueProducts(): string[] {
    const seen = new Set<string>();
    return this.filteredShops.flatMap(shop => shop.products)
      .filter(p => {
        const key = p.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }
}
