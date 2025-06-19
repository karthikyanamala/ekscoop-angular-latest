import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CornerBadgeComponent } from '../corner-badge/corner-badge.component';

@Component({
  selector: 'app-about',
  imports:[CommonModule,CornerBadgeComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
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
}
