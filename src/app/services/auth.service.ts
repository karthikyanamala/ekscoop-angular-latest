import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore // inject Firestore
  ) {
    // Listen for auth state changes
    auth.onAuthStateChanged(user => {
      this.currentUserSubject.next(user);
    });
  }

  async googleLogin(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      this.currentUserSubject.next(user);

      console.log('✅ User logged in:', user.displayName, user.email, user.uid);

      // Update Firestore with user's profile
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userDocRef, {
        email: user.email,
        fullName: user.displayName,
        
      }, { merge: true });

      console.log('🔥 Firestore user profile updated successfully!');
    } catch (error: any) {
      console.error('🔥 Google login failed:', error.code, error.message);
      throw error; // propagate error so component can handle it
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }
}
