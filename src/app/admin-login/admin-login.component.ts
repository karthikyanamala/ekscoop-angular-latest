import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  Auth,
  ConfirmationResult
} from 'firebase/auth';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent implements OnInit {
  phoneNumber: string = '';
  otp: string = '';
  verificationId: string = '';
  auth: Auth;
  loading = false;
  errorMessage = '';
  loggedIn = false;

  // Set your actual admin number here
 

  constructor(private router: Router) {
    this.auth = getAuth();
  }

  ngOnInit(): void {
    this.auth.useDeviceLanguage();

    setTimeout(() => {
      if (!(window as any).recaptchaVerifier) {
        const verifier = new RecaptchaVerifier(
          this.auth,
          'recaptcha-container',
          {
            size: 'invisible',
            callback: () => this.sendOTP()
          }
        );
        verifier.render();
        (window as any).recaptchaVerifier = verifier;
      }
    }, 0);
  }

  sendOTP(): void {
    this.errorMessage = '';
    if (this.phoneNumber.length !== 10) {
      this.errorMessage = 'Please enter a valid 10-digit phone number.';
      return;
    }

    const fullPhone = '+91' + this.phoneNumber;
   

    this.loading = true;
    const appVerifier = (window as any).recaptchaVerifier;

    signInWithPhoneNumber(this.auth, fullPhone, appVerifier)
      .then((confirmationResult) => {
        this.verificationId = confirmationResult.verificationId;
        this.loading = false;
      })
      .catch((error: any) => {
        this.loading = false;
        this.errorMessage = error.message;
      });
  }

  verifyOTP(): void {
    this.errorMessage = '';
    if (this.otp.length !== 6) {
      this.errorMessage = 'Please enter a 6-digit OTP.';
      return;
    }

    this.loading = true;

    const credential = PhoneAuthProvider.credential(this.verificationId, this.otp);
    signInWithCredential(this.auth, credential)
      .then(() => {
        this.loggedIn = true;
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/admin']);
        }, 1000);
      })
      .catch((error: any) => {
        this.loading = false;
        this.errorMessage = error.message;
      });
  }
}
