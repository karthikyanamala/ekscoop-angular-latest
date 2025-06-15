// admin/shop-list/shop-list.component.ts
import { Component, OnInit } from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { HomeContentService } from '../../services/homeservices';
import { geohashForLocation } from 'geofire-common';

@Component({
  selector: 'app-admin-shop-list',
  standalone:true,
  templateUrl: './shop-list.component.html',
  imports: [CommonModule,FormsModule],
  styleUrls: ['./shop-list.component.scss']
})
export class AdminShopListComponent {
  shops: any[] = [];
  newShop = {
    name: '',
    latitude: 0,
    longitude: 0,
    products: '',
    whatsappNumber: '',
    address:'',
    openingTime: '',
  closingTime: '' 
  };
    

  constructor(private shopService: ShopService,private homeContentService: HomeContentService) {}



addShop() {
  const lat = this.newShop.latitude;
  const lng = this.newShop.longitude;

  const shopToAdd = {
    name: this.newShop.name,
    address: this.newShop.address || '',
    latitude: lat,
    longitude: lng,
    whatsappNumber: this.newShop.whatsappNumber,
    products: this.newShop.products.split(',').map(p => p.trim()),
    geohash: geohashForLocation([lat, lng]),
     openingTime: this.newShop.openingTime,
  closingTime: this.newShop.closingTime
  };

  this.shopService.addShop(shopToAdd).then(() => {
    alert('Shop added successfully!');
    this.newShop = {
      name: '',
      latitude: 0,
      longitude: 0,
      products: '',
      whatsappNumber: '',
      address: '',
       openingTime: '',
  closingTime: '' 
    };
  }).catch(err => {
    console.error('Failed to add shop:', err);
  });
}

deleteNumber = '';
deleteStatus: 'success' | 'notfound' | 'error' | '' = '';

async deleteShop() {
  try {
    const deleted = await this.shopService.deleteShopByWhatsApp(this.deleteNumber.trim());
    this.deleteStatus = deleted ? 'success' : 'notfound';
  } catch (e) {
    console.error(e);
    this.deleteStatus = 'error';
  }

  // Optional: reset status after a few seconds
  setTimeout(() => this.deleteStatus = '', 4000);
}

}

