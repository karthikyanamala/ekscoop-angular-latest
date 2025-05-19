import { Injectable } from '@angular/core';
import { Firestore, docData, doc,setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeContentService {
  constructor(private firestore: Firestore) {}

    // Update or add Hero Section
    setHeroSection(data: any): Promise<void> {
        const heroDocRef = doc(this.firestore, 'homepage/hero');
        return setDoc(heroDocRef, data);  // Set data (overwrites if exists)
      }
    
      // Update or add About Product Section
      setAboutProduct(data: any): Promise<void> {
        const aboutProductDocRef = doc(this.firestore, 'homepage/about');
        return setDoc(aboutProductDocRef, data);  // Set data (overwrites if exists)
      }
    
      // Update or add How It Works Section
      setHowItWorks(data: any): Promise<void> {
        const howItWorksDocRef = doc(this.firestore, 'homepage/howItWorks');
        return setDoc(howItWorksDocRef, data);  // Set data (overwrites if exists)
      }
    
      // Update or add For Shop Owners Section
      setForShopOwners(data: any): Promise<void> {
        const shopOwnersDocRef = doc(this.firestore, 'homepage/shopOwners');
        return setDoc(shopOwnersDocRef, data);  // Set data (overwrites if exists)
      }
    
      // Update or add Why Protein Matters Section
      setWhyProteinMatters(data: any): Promise<void> {
        const proteinMattersDocRef = doc(this.firestore, 'homepage/proteinFacts');
        return setDoc(proteinMattersDocRef, data);  // Set data (overwrites if exists)
      }

  getHeroSection(): Observable<any> {
    return docData(doc(this.firestore, 'homepage/hero'));
  }

  getAboutProduct(): Observable<any> {
    return docData(doc(this.firestore, 'homepage/about'));
  }

  getHowItWorks(): Observable<any> {
    return docData(doc(this.firestore, 'homepage/howItWorks'));
  }

  getForShopOwners(): Observable<any> {
    return docData(doc(this.firestore, 'homepage/shopOwners'));
  }

  getWhyProteinMatters(): Observable<any> {
    return docData(doc(this.firestore, 'homepage/proteinFacts'));
  }
}
