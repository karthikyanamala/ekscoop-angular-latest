import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Meta } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-footer-privacy',
  imports: [CommonModule],
  templateUrl: './footer-privacy.component.html',
  styleUrl: './footer-privacy.component.css'
})
export class FooterPrivacyComponent implements OnInit {
     constructor(private title: Title, private meta: Meta) {}

  ngOnInit(): void {
    this.title.setTitle('Privacy Policy | you x 0.8');
    this.meta.addTag({ name: 'robots', content: 'noindex, follow' });
  }
}
