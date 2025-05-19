import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-footer-protien-guid',
  imports: [],
  templateUrl: './footer-protien-guid.component.html',
  styleUrl: './footer-protien-guid.component.css'
})
export class FooterProtienGuidComponent implements OnInit{
    constructor(private title: Title, private meta: Meta) {}

  ngOnInit(): void {
    this.title.setTitle('Protein Guide | you x 0.8');
    this.meta.addTags([
      { name: 'description', content: 'Understand the science behind our 20g protein recommendation.' },
       { name: 'keywords', content: 'you x 0.8, protein stores, protein near me, buy protein powder,ekscoop,ek scoop, protien,ekScoop, ekscoop protein, you x 0.8, protein sachets India, buy protein powder, single scoop protein, protein for Indian food, protein for tea, protein near me, affordable protein, healthy protein powder, clean protein India, daily protein intake, sugar-free protein powder, plant based protein India, whey protein isolate India, protein for women, gym protein India"' },
      { name: 'robots', content: 'index, follow' }
    ]);
  }
}
