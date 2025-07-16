import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { CornerBadgeComponent } from '../corner-badge/corner-badge.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CornerBadgeComponent],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {
  constructor(private titleService: Title, private metaService: Meta) {}

  ngOnInit(): void {
    this.titleService.setTitle('Contact ekScoop | Protein for Indian Meals');

    this.metaService.addTags([
      {
        name: 'description',
        content:
          'Get in touch with ekScoop – the makers of YOU x 0.8 protein. Reach us for orders, distributor inquiries, support, or collaboration.'
      },
      {
        name: 'keywords',
        content:
          'contact ekScoop, YOU x 0.8 customer care, protein brand contact India, plant protein seller support, nutrition distributor contact, buy protein for roti, vegan protein help desk'
      },
      {
        property: 'og:title',
        content: 'Contact ekScoop | YOU x 0.8 Plant Protein Support'
      },
      {
        property: 'og:description',
        content:
          'Need help with ekScoop plant protein? Reach out for orders, feedback, or collaboration. We’re always here to help.'
      },
      {
        property: 'og:url',
        content: 'https://ekscoop.com/contact-us'
      },
      {
        name: 'robots',
        content: 'index, follow'
      }
    ]);
  }
}
