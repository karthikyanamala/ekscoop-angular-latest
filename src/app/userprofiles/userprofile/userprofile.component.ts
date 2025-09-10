import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import {
  Firestore, doc, getDoc, updateDoc, serverTimestamp,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';

import { ProfileHeaderComponent } from '../profile-header/profile-header.component';
import { CornerBadgeComponent } from '../../corner-badge/corner-badge.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProfileHeaderComponent, CornerBadgeComponent],
  templateUrl: './userprofile.component.html',
  styleUrls: ['./userprofile.component.css'],
})
export class ProfileComponent implements OnInit {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private functions: Functions = inject(Functions);

  uid = '';
  profile: any = { fullName: '', phoneNumber: '', gender: '', email: '' };

  loading = true;

  // UI states
  sendingOtp = false;
  verifyingOtp = false;
  savingProfile = false;

  // Locks
  phoneVerified = false;   // phone field locked once verified
  genderLocked = false;    // gender select locked once saved

  // OTP modal state
  showOtpModal = false;
  enteredOtp = '';
  otpError = '';

  // messages
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    onAuthStateChanged(this.auth, async (user: User | null) => {
      if (!user) {
        this.errorMessage = 'Please login first.';
        this.loading = false;
        return;
      }
      this.uid = user.uid;

      try {
        const profileRef = doc(this.firestore, `users/${this.uid}`);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          this.profile = {
            fullName: data.fullName || '',
            email: data.email || user.email || '',
            phoneNumber: data.phoneNumber || '',
            gender: data.gender || '',
          };

          // derive locks from stored flags
          this.phoneVerified = !!data.verified;
          this.genderLocked = !!data.genderLocked || !!data.gender;
        }
      } catch (err) {
        console.error(err);
        this.errorMessage = 'Failed to load profile.';
      } finally {
        this.loading = false;
      }
    });
  }

  /* ----------------------------- OTP flow ----------------------------- */

  async openOtpModal() {
    this.enteredOtp = '';
    this.otpError = '';
    this.successMessage = '';
    this.errorMessage = '';

    // basic validation before calling function
    if (!this.isPhoneValid()) {
      this.errorMessage = 'Please enter a valid 10-digit phone number.';
      return;
    }

    this.showOtpModal = true;
    this.sendingOtp = true;

    try {
      const sendOtpFn = httpsCallable(this.functions, 'sendOtp');
      const phoneE164 = '+91' + String(this.profile.phoneNumber);
      await sendOtpFn({ phone: phoneE164 });
      this.successMessage = 'OTP sent successfully!';
    } catch (error) {
      console.error(error);
      this.errorMessage = 'Failed to send OTP. Please try again.';
      this.showOtpModal = false;
    } finally {
      this.sendingOtp = false;
    }
  }

  async verifyOtp() {
    this.verifyingOtp = true;
    this.otpError = '';
    try {
      const verifyOtpFn = httpsCallable(this.functions, 'verifyOtp');
      const phoneE164 = '+91' + String(this.profile.phoneNumber);
      await verifyOtpFn({ uid: this.uid, phone: phoneE164, otp: this.enteredOtp });

      // lock phone
      this.phoneVerified = true;
      this.successMessage = 'Phone verified successfully!';
      this.showOtpModal = false;

      // persist verification flags
      const ref = doc(this.firestore, `users/${this.uid}`);
      await updateDoc(ref, {
        verified: true,
        verifiedPhoneNumber: this.profile.phoneNumber,
        verifiedAt: serverTimestamp(),
        phoneNumber: this.profile.phoneNumber, // keep phone in sync
      });
    } catch (error) {
      console.error(error);
      this.otpError = 'Invalid OTP. Please try again.';
      this.phoneVerified = false;
    } finally {
      this.verifyingOtp = false;
    }
  }

  closeOtpModal() { this.showOtpModal = false; }

  /* -------------------------- Save profile --------------------------- */

  async updateProfile() {
    this.successMessage = '';
    this.errorMessage = '';

    // Validate requireds
    if (!this.isPhoneValid()) {
      this.errorMessage = 'Please enter a valid 10-digit phone number.';
      return;
    }
    if (!this.phoneVerified) {
      this.errorMessage = 'Please verify your phone number before saving.';
      return;
    }
    if (!this.profile.gender) {
      this.errorMessage = 'Please select your gender.';
      return;
    }

    this.savingProfile = true;
    try {
      const ref = doc(this.firestore, `users/${this.uid}`);
      await updateDoc(ref, {
        phoneNumber: this.profile.phoneNumber,
        gender: this.profile.gender,
        // lock gender once saved
        genderLocked: true,
        updatedAt: serverTimestamp(),
      });

      this.genderLocked = true;
      this.successMessage = 'Profile updated successfully!';
    } catch (error) {
      console.error(error);
      this.errorMessage = 'Failed to update profile.';
    } finally {
      this.savingProfile = false;
    }
  }

  /* --------------------------- utilities ---------------------------- */

  isPhoneValid(): boolean {
    return /^\d{10}$/.test(String(this.profile.phoneNumber || '').trim());
  }
}
