// shop.service.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  startAt,
  endAt,
  getDocs
} from '@angular/fire/firestore';
import { where } from '@angular/fire/firestore';
import { Shop } from '../model/shop.model';
import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private shopCollection;
  private inMemoryCache: Record<string, Shop[]> = {};
  private CACHE_EXPIRY_MINUTES = 15;

  constructor(private firestore: Firestore) {
    this.shopCollection = collection(this.firestore, 'shops');
  }

  
  private getCacheKey(lat: number, lng: number, radius: number): string {
    const roundedLat = +lat.toFixed(4);
  const roundedLng = +lng.toFixed(4);
  return `${roundedLat}-${roundedLng}-${radius}`;
  }

  private loadFromLocalStorage(key: string): Shop[] | null {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > this.CACHE_EXPIRY_MINUTES * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  }

  private saveToLocalStorage(key: string, data: Shop[]): void {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  }

  getShopsOnce(): Promise<Shop[]> {
  return getDocs(this.shopCollection).then(snapshot => {
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Shop[];
  });
}

  async getShopsNearby(lat: number, lng: number, radiusInKm: number): Promise<Shop[]> {
    const key = this.getCacheKey(lat, lng, radiusInKm);

    //Check local storage cache first
    const cachedData = this.loadFromLocalStorage(key);
    if (cachedData) {
      console.log('✅ Using cached result from localStorage:', key);
      return cachedData;
    }

    const center: [number, number] = [lat, lng];
    const radiusInM = radiusInKm * 1000;
    const bounds = geohashQueryBounds(center, radiusInM);

    const snapshots = await Promise.all(
      bounds.map(b => {
        const q = query(
          this.shopCollection,
          orderBy('geohash'),
          startAt(b[0]),
          endAt(b[1])
        );
        return getDocs(q);
      })
    );

    const nearbyShops: Shop[] = [];

    snapshots.forEach(snap => {
      snap.docs.forEach(doc => {
        const shop = { id: doc.id, ...doc.data() } as Shop;
        const distance = distanceBetween([shop.latitude, shop.longitude], center);
        if (distance <= radiusInKm) {
          shop.distance = distance;
          nearbyShops.push(shop);
        }
      });
    });

    const sorted = nearbyShops.sort((a, b) => (a.distance! - b.distance!));
    this.inMemoryCache[key] = sorted;
    this.saveToLocalStorage(key, sorted);
    return sorted;
  }

  addShop(shop: Omit<Shop, 'geohash'>) {
    const shopWithGeohash = {
      ...shop,
      geohash: geohashForLocation([shop.latitude, shop.longitude])
    };
    return addDoc(this.shopCollection, shopWithGeohash);
  }



async deleteShopByWhatsApp(whatsapp: string): Promise<boolean> {
  const q = query(this.shopCollection, where('whatsappNumber', '==', whatsapp));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.warn('❌ No shop found with WhatsApp:', whatsapp);
    return false;
  }

  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(this.firestore, 'shops', docSnap.id));
    console.log('✅ Deleted shop:', docSnap.id);
  }

  return true;
}

}
