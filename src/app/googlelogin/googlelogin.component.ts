import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';


@Component({
  selector: 'app-google-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './googlelogin.component.html',
  styleUrls: ['./googlelogin.component.css']
})
export class GoogleLoginComponent {
  auth = getAuth();

 loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(this.auth, provider)
    .then(async (result) => {
      const user = result.user;
      console.log('Logged in user:', user.displayName, user.email);
      alert(`Welcome ${user.displayName || 'user'}!`);

      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid); // store under users/{uid}
      
      await setDoc(userRef, {
        email: user.email,
        fullName: user.displayName,
        verified: true
      }, { merge: true }); // merge:true updates existing fields without overwriting others

      console.log('User profile updated in Firestore!');
    })
    .catch((error) => {
      console.error(error);
      alert('Login failed. Please try again.');
    });
}

}
