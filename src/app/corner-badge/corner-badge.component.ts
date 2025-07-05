import { Component, HostListener } from '@angular/core';
import { GoogleLoginComponent } from '../googlelogin/googlelogin.component';
import { ProfileComponent } from '../profile/profile.component';

@Component({
  selector: 'app-corner-badge',
  imports: [GoogleLoginComponent,ProfileComponent],
  templateUrl: './corner-badge.component.html',
  styleUrl: './corner-badge.component.css'
})
export class CornerBadgeComponent {
  isScrolled = false;
  menuOpen = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 10;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }
}
