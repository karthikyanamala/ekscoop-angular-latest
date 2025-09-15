import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
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

  @ViewChild('dropdownRef', { static: false }) dropdownRef?: ElementRef<HTMLElement>;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    window.addEventListener('scroll', () => {
      this.isScrolled = window.scrollY > 20;
      if (this.menuOpen) this.closeMenu(); // close on scroll to avoid floating menu
    });

    this.authService.getCurrentUser().subscribe(user => {
      this.userName = user?.displayName ?? null;
    });
  }

  // close when clicking outside
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    if (!this.menuOpen) return;
    const host = this.dropdownRef?.nativeElement;
    if (host && !host.contains(ev.target as Node)) this.closeMenu();
  }

  // close on ESC
  @HostListener('document:keydown.escape')
  onEsc() { this.closeMenu(); }

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

  toggleMenu() { this.menuOpen = !this.menuOpen; }
  closeMenu() { this.menuOpen = false; }
}
