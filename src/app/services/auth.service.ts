import { Injectable, Inject, PLATFORM_ID, Optional } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Auth, getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth | null = null;

  // ⬇️ May be null on the server – that’s OK
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Optional() private firestore: Firestore | null // <-- optional to avoid NullInjectorError
  ) {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize auth only in browser
      try {
        this.auth = getAuth();
        this.auth.onAuthStateChanged(user => this.currentUserSubject.next(user));
      } catch (e) {
        console.error('[AuthService] init error', e);
      }
    } else {
      // On the server, emit null and don’t touch Firebase
      this.currentUserSubject.next(null);
    }
  }

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$ ?? of(null);
  }

  async googleLogin(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.auth) return;

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    const user = result.user;
    this.currentUserSubject.next(user);

    // Only attempt Firestore if it exists (browser + provider present)
    if (this.firestore) {
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userDocRef, {
        email: user.email,
        fullName: user.displayName,
      }, { merge: true });
    }
  }

  async logout(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.auth) return;
    await signOut(this.auth);
    this.currentUserSubject.next(null);
  }
}
