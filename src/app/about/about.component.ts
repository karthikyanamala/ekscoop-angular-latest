import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CornerBadgeComponent } from '../corner-badge/corner-badge.component';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, CornerBadgeComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  values = [
    { icon: '🏪', title: 'Help small retailers compete with online giants' },
    { icon: '🧪', title: 'Make reliable, science-backed health products accessible' },
    { icon: '📚', title: 'Educate and empower Indian households about daily nutrition' },
    { icon: '💬', title: 'Support native languages, local cultures, and regional preferences' }
  ];

  why = [
    { title: 'Community Focus', description: 'While big brands focus on clicks, we focus on community.' },
    { title: 'Direct Partnership', description: 'We work directly with retail stores near you.' },
    { title: 'Local Support', description: 'Every product you buy from ekScoop supports a local business.' },
    { title: 'Technology & Trust', description: 'We bring technology, trust, and transparency to India’s most powerful network — your local shop.' }
  ];

  constructor(private titleService: Title, private metaService: Meta) {}

  ngOnInit(): void {
    this.titleService.setTitle(
      'About ekScoop | Solving India’s Protein Gap with Local Power'
    );

    this.metaService.addTags([
      {
        name: 'description',
        content:
          'ekScoop is on a mission to fix India’s hidden protein deficiency. We build clean, science-backed health products and empower small retailers to compete with big online brands.'
      },
      {
        name: 'keywords',
        content:
          'about ekScoop, YOU x 0.8 mission, protein gap in India, plant protein brand India, help Indian retailers, local health brands, science backed protein, why ekScoop, nutrition education India, protein for Indian families'
      },
      {
        property: 'og:title',
        content: 'About ekScoop | Clean Protein, Local Impact'
      },
      {
        property: 'og:description',
        content:
          'Learn why ekScoop is building India’s first unflavoured, mixable protein and supporting your trusted local retailers.'
      },
      {
        property: 'og:url',
        content: 'https://www.ekscoop.com/about-us'
      },
      {
        name: 'robots',
        content: 'index, follow'
      }
    ]);
  }
}
