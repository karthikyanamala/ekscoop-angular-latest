import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Meta } from '@angular/platform-browser';
@Component({
  selector: 'app-footer-twitter',
  imports: [],
  templateUrl: './footer-twitter.component.html',
  styleUrl: './footer-twitter.component.css'
})
export class FooterTwitterComponent implements OnInit{
     constructor(private title: Title, private meta: Meta) {}

  ngOnInit(): void {
    this.title.setTitle('Follow Us on Twitter | you x 0.8');
     this.meta.addTags([
      { name: 'description', content: 'Catch real-time updates and brand news on Twitter.' },
       { name: 'keywords', content: 'you x 0.8, protein stores, protein near me, buy protein powder,ekscoop,ek scoop, protien,ekScoop, ekscoop protein, you x 0.8, protein sachets India, buy protein powder, single scoop protein, protein for Indian food, protein for tea, protein near me, affordable protein, healthy protein powder, clean protein India, daily protein intake, sugar-free protein powder, plant based protein India, whey protein isolate India, protein for women, gym protein India"' },
      { name: 'robots', content: 'index, follow' }
    ]);
  }
}
