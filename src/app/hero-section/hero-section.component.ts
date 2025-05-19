import { Component, OnInit } from '@angular/core';
import { HomeContentService } from '../services/homeservices';

@Component({
  standalone:true,
  selector: 'app-hero-section',
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css']
})
export class HerosectionComponent implements OnInit {
  data: any;

  constructor(private contentService: HomeContentService) { }

  ngOnInit(): void {
    this.contentService.getHeroSection().subscribe(data => {
      this.data = data;
    });
  }
}
