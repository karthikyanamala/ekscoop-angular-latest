import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { RouterModule } from '@angular/router';
import { ProfileHeaderComponent } from '../profile-header/profile-header.component';
import { CornerBadgeComponent } from '../../corner-badge/corner-badge.component';
import { Functions, httpsCallable } from '@angular/fire/functions';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProfileHeaderComponent, CornerBadgeComponent],
  templateUrl: './userprofile.component.html',
  styleUrls: ['./userprofile.component.css'],
})
export class ProfileComponent implements OnInit {
  auth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);
  functions: Functions = inject(Functions);

  uid: string = '';
  profile: any = { fullName: '', phoneNumber: '', gender: '', email: '' };

  loading = true;
  sendingOtp = false;
  verifyingOtp = false;
  savingProfile = false;
  phoneVerified = false;
  showOtpModal = false;
  enteredOtp = '';
  otpError = '';
  errorMessage = '';
  successMessage = '';
  genderAlreadySaved = false;

  ngOnInit() {
    onAuthStateChanged(this.auth, async (user: User | null) => {
      if (!user) { this.errorMessage = 'Please login first.'; this.loading = false; return; }
      this.uid = user.uid;
      try {
        const profileDoc = doc(this.firestore, `users/${this.uid}`);
        const profileSnap = await getDoc(profileDoc);
        if (profileSnap.exists()) {
          this.profile = profileSnap.data();
          this.phoneVerified = !!this.profile.verified;
          this.genderAlreadySaved = !!this.profile.gender;
        }
      } catch (error: any) {
        console.error(error);
        this.errorMessage = 'Failed to load profile.';
      } finally {
        this.loading = false;
      }
    });
  }

  async openOtpModal() {
    this.enteredOtp = '';
    this.otpError = '';
    this.showOtpModal = true;
    this.sendingOtp = true;

    try {
      const sendOtpFn = httpsCallable(this.functions, 'sendOtp');
      const phoneWithCountryCode = '+91' + this.profile.phoneNumber;
      await sendOtpFn({ phone: phoneWithCountryCode });
      this.successMessage = 'OTP sent successfully!';
      this.errorMessage = '';
    } catch (error: any) {
      console.error(error);
      this.errorMessage = 'Failed to send OTP. Please try again.';
      this.showOtpModal = false;
    } finally {
      this.sendingOtp = false;
    }
  }

  async verifyOtp() {
    this.verifyingOtp = true;
    try {
      const verifyOtpFn = httpsCallable(this.functions, 'verifyOtp');
      const phoneWithCountryCode = '+91' + this.profile.phoneNumber;
      await verifyOtpFn({ uid: this.uid, phone: phoneWithCountryCode, otp: this.enteredOtp });
      this.phoneVerified = true;
      this.successMessage = 'Phone verified successfully!';
      this.showOtpModal = false;
    } catch (error: any) {
      console.error(error);
      this.otpError = 'Invalid OTP. Please try again.';
      this.phoneVerified = false;
    } finally {
      this.verifyingOtp = false;
    }
  }

  async updateProfile() {
    this.successMessage = '';
    this.errorMessage = '';

    // ✅ Always validate inputs before saving
    if (!this.isPhoneValid() || !this.profile.gender) {
      this.errorMessage = 'Please enter both phone number and gender.';
      return;
    }
    if (!this.phoneVerified) {
      this.errorMessage = 'Phone number must be verified before saving.';
      return;
    }

    this.savingProfile = true;
    try {
      const profileDoc = doc(this.firestore, `users/${this.uid}`);
      await updateDoc(profileDoc, {
        phoneNumber: this.profile.phoneNumber,
        gender: this.profile.gender,
      });
      this.successMessage = 'Profile updated successfully!';
      this.genderAlreadySaved = true;
    } catch (error: any) {
      console.error(error);
      this.errorMessage = 'Failed to update profile.';
    } finally {
      this.savingProfile = false;
    }
  }

  isPhoneValid(): boolean { return /^\d{10}$/.test(this.profile.phoneNumber || ''); }

  closeOtpModal() { this.showOtpModal = false; }
}
