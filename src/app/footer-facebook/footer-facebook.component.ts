import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Meta } from '@angular/platform-browser';
@Component({
  selector: 'app-footer-facebook',
  imports: [],
  templateUrl: './footer-facebook.component.html',
  styleUrl: './footer-facebook.component.css'
})
export class FooterFacebookComponent implements OnInit{
    constructor(private title: Title, private meta: Meta) {}

  ngOnInit(): void {
    this.title.setTitle('Follow Us on Facebook | you x 0.8');
    this.meta.addTags([
      { name: 'description', content: 'Engage with our community and share your protein journey.' },
      { name: 'robots', content: 'index, follow' }
    ]);
  }
}
