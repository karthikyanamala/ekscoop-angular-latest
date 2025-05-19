import { Injectable } from '@angular/core';
import { Firestore, collectionData, collection, doc, updateDoc, deleteDoc, addDoc } from '@angular/fire/firestore';
import { Shop } from '../model/shop.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ShopService {
  constructor(private firestore: Firestore) {}

  getShops(): Observable<Shop[]> {
    const shopRef = collection(this.firestore, 'shops');
    return collectionData(shopRef, { idField: 'id' }) as Observable<Shop[]>;
  }

  addShop(shop: Shop) {
    const shopRef = collection(this.firestore, 'shops');
    return addDoc(shopRef, shop);
  }

  updateShop(id: string, shop: Shop) {
    const shopDocRef = doc(this.firestore, 'shops', id);
    return updateDoc(shopDocRef, shop as any);
  }

  deleteShop(id: string) {
    const shopDocRef = doc(this.firestore, 'shops', id);
    return deleteDoc(shopDocRef);
  }
}
