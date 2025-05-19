import { Component, OnInit,CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { HomeContentService } from '../services/homeservices';


@Component({
  selector: 'app-why-protein-matters',
  standalone:true,
  templateUrl: './why-protien-matters.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: ['why-protien-matters.component.css']
})
export class WhyproteinmattersComponent implements OnInit {
  data: any;

  constructor(private contentService: HomeContentService) { }

  ngOnInit(): void {
    this.contentService.getWhyProteinMatters().subscribe(data => {
      this.data = data;
    });
  }
}
