import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Meta } from '@angular/platform-browser';
@Component({
  selector: 'app-footer-contact',
  imports: [],
  templateUrl: './footer-contact.component.html',
  styleUrl: './footer-contact.component.css'
})
export class FooterContactComponent implements OnInit{
     constructor(private title: Title, private meta: Meta) {}

  ngOnInit(): void {
    this.title.setTitle('Contact Us | you x 0.8');
    this.meta.addTags([
      { name: 'description', content: 'Have questions? Contact the you x 0.8 team today.' },
      { name: 'robots', content: 'index, follow' }
    ]);
    
  }

  onSubmit(event: Event) {
  event.preventDefault();
  alert('Thanks for reaching out! We will contact you shortly.');
}
}
