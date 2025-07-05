import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-popup.component.html',
  styleUrls: ['./auth-popup.component.css']
})
export class AuthPopupComponent {
  isLoading = false;

  constructor(private authService: AuthService) {}

  async handleGoogleSignIn() {
    this.isLoading = true;
    try {
      await this.authService.googleLogin();
      window.dispatchEvent(new CustomEvent('auth-success')); // notify parent component
    } catch (error) {
      alert('Login failed. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }
}
