import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
 constructor(public router: Router) {}
   isSpecialPage(): boolean {
    return this.router.url === '/home'; // change '/home' to your target page
  }

}
