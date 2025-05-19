import { Component, OnInit } from '@angular/core';
import { HomeContentService } from '../services/homeservices';

@Component({
  selector: 'app-for-shop-owners',
  standalone:true,
  templateUrl: './for-shop-owners.component.html',
  styleUrls: ['./for-shop-owners.component.css']
})
export class ForshopownersComponent implements OnInit {
  data: any;

  constructor(private contentService: HomeContentService) { }

  ngOnInit(): void {
    this.contentService.getForShopOwners().subscribe(data => {
      this.data = data;
    });
  }
}
