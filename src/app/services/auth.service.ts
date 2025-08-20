import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth, getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth | null = null;
  private firestore: Firestore | null = null;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

 constructor(
  @Inject(PLATFORM_ID) private platformId: Object,
  @Inject(Firestore) firestore: Firestore
) {
  this.firestore = firestore;

  if (isPlatformBrowser(this.platformId)) {
    setTimeout(() => {
      try {
        this.auth = getAuth(); // ✅ getAuth after app bootstrap

        this.auth.onAuthStateChanged(user => {
          this.currentUserSubject.next(user);
        });
      } catch (error) {
        console.error('[AuthService Init Error]', error);
      }
    });
  }
}


  async googleLogin(): Promise<void> {
    if (!this.auth || !this.firestore) return;

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    const user = result.user;
    this.currentUserSubject.next(user);

    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    await setDoc(userDocRef, {
      email: user.email,
      fullName: user.displayName,
    }, { merge: true });
  }

  async logout(): Promise<void> {
    if (this.auth) {
      await signOut(this.auth);
      this.currentUserSubject.next(null);
    }
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }
}
