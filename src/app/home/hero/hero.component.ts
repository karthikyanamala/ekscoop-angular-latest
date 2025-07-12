import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-hero',
  imports:[CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnInit {
  isMobile = false;
  showModern = true;

  ngOnInit(): void {
    this.checkIfMobile();
    if (this.isMobile) {
      setInterval(() => {
        this.showModern = !this.showModern;
      }, 2000);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkIfMobile();
  }

  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }
}
