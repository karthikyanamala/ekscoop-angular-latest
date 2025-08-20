import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() title = 'Sign in required';
  @Input() subtitle = 'Please sign in to continue.';
  @Output() closed = new EventEmitter<void>();

  isLoading = false;

  constructor(private authService: AuthService) {}

  async handleGoogleSignIn() {
    this.isLoading = true;
    try {
      await this.authService.googleLogin();
      window.dispatchEvent(new CustomEvent('auth-success')); // notify parent
    } catch {
      alert('Login failed. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  close() {
    this.closed.emit(); // parent will clear the dynamically created component
  }
}
