import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  isScrolled = false;
  menuOpen = false;
  userName: string | null = null;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.addEventListener('scroll', () => {
      this.isScrolled = window.scrollY > 20;
    });

    this.authService.getCurrentUser().subscribe(user => {
      this.userName = user?.displayName ?? null;
    });
  }

  login() {
    this.authService.googleLogin().then(() => {
      this.router.navigate(['/']);
    });
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/']);
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }
}
