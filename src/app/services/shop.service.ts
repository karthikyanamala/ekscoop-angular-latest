import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  getDocs,
  CollectionReference,
} from '@angular/fire/firestore';
import { where } from '@angular/fire/firestore';
import { Shop } from '../model/shop.model';
import {
  geohashForLocation,
  geohashQueryBounds,
  distanceBetween,
} from 'geofire-common';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private shopCollection: CollectionReference | null = null;
  private inMemoryCache: Record<string, Shop[]> = {};
  private CACHE_EXPIRY_MINUTES = 15;
  private isBrowser: boolean;

  constructor(
    private firestore: Firestore,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Only assign Firestore collection on browser
    if (this.isBrowser) {
      console.log('[QuestionDetailComponent45678] Fetching answers...');
      this.shopCollection = collection(this.firestore, 'shops');
    }
  }

  private getCacheKey(lat: number, lng: number, radius: number): string {
    const roundedLat = +lat.toFixed(4);
    const roundedLng = +lng.toFixed(4);
    return `${roundedLat}-${roundedLng}-${radius}`;
  }

  private loadFromLocalStorage(key: string): Shop[] | null {
    if (!this.isBrowser) return null;

    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const isExpired =
        Date.now() - timestamp > this.CACHE_EXPIRY_MINUTES * 60 * 1000;
      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch (error) {
      console.error('LocalStorage load error:', error);
      return null;
    }
  }

  private saveToLocalStorage(key: string, data: Shop[]): void {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(
        key,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (error) {
      console.error('LocalStorage save error:', error);
    }
  }

  async getShopsOnce(): Promise<Shop[]> {
    if (!this.shopCollection) return [];

    try {
      const snapshot = await getDocs(this.shopCollection);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Shop[];
    } catch (error) {
      console.error('Error loading shops:', error);
      return [];
    }
  }

  async getShopsNearby(
    lat: number,
    lng: number,
    radiusInKm: number
  ): Promise<Shop[]> {
    if (!this.shopCollection) return [];

    const key = this.getCacheKey(lat, lng, radiusInKm);

    if (this.isBrowser) {
      const cachedData = this.loadFromLocalStorage(key);
      if (cachedData) {
        console.log('✅ Using cached result from localStorage:', key);
        return cachedData;
      }
    }

    const center: [number, number] = [lat, lng];
    const radiusInM = radiusInKm * 1000;
    const bounds = geohashQueryBounds(center, radiusInM);

    try {
      const snapshots = await Promise.all(
        bounds.map((b) => {
          const q = query(
            this.shopCollection!,
            orderBy('geohash'),
            startAt(b[0]),
            endAt(b[1])
          );
          return getDocs(q);
        })
      );

      const nearbyShops: Shop[] = [];

      snapshots.forEach((snap) => {
        snap.docs.forEach((doc) => {
          const shop = {
            id: doc.id,
            ...doc.data(),
          } as Shop;

          const distance = distanceBetween(
            [shop.latitude, shop.longitude],
            center
          );

          if (distance <= radiusInKm) {
            shop.distance = distance;
            nearbyShops.push(shop);
          }
        });
      });

      const sorted = nearbyShops.sort((a, b) => a.distance! - b.distance!);
      this.inMemoryCache[key] = sorted;

      if (this.isBrowser) {
        this.saveToLocalStorage(key, sorted);
      }

      return sorted;
    } catch (error) {
      console.error('Error loading nearby shops:', error);
      return [];
    }
  }

  addShop(shop: Omit<Shop, 'geohash'>) {
    if (!this.shopCollection) {
      throw new Error('Firestore not initialized on server');
    }

    const shopWithGeohash = {
      ...shop,
      geohash: geohashForLocation([shop.latitude, shop.longitude]),
    };

    return addDoc(this.shopCollection, shopWithGeohash);
  }

  async deleteShopByWhatsApp(whatsapp: string): Promise<boolean> {
    if (!this.shopCollection) return false;

    try {
      const q = query(
        this.shopCollection,
        where('whatsappNumber', '==', whatsapp)
      );
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
    } catch (error) {
      console.error('Error deleting shop:', error);
      return false;
    }
  }
}
