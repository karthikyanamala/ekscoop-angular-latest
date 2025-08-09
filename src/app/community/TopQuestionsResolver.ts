import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Firestore, collection, query, limit, getDocs } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class TopQuestionsResolver implements Resolve<any[]> {
  constructor(private firestore: Firestore) {}

  async resolve(): Promise<any[]> {
    const ref = collection(this.firestore, 'QUESTIONS_PATH');
    const q = query(ref, limit(10));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data());
  }
}
