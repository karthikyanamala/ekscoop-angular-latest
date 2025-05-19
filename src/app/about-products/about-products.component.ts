import { Component, OnInit } from '@angular/core';
import { HomeContentService } from '../services/homeservices';

@Component({
  selector: 'app-about-product',
  templateUrl: './about-products.component.html',
  styleUrls: ['./about-products.component.css']
})
export class AboutproductComponent implements OnInit {
  data: any;

  constructor(private contentService: HomeContentService) { }

  ngOnInit(): void {
    this.contentService.getAboutProduct().subscribe(data => {
      this.data = data;
    });
  }
}
