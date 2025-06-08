import { Injectable } from '@angular/core';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root',
  
})
export class LocationService {
 getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocation not supported');
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log('📍 Fresh location:', lat, lng);
          resolve({ lat, lng });
        },
        (error) => {
          console.error('Location error:', error);
          reject(error.message);
        },
        {
          enableHighAccuracy: true,  // Use GPS
          timeout: 10000,            // Wait max 10 sec
          maximumAge: 0              // 🚫 Do NOT use cache
        }
      );
    }
  });
}



  getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
