import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-showcase',
  imports:[CommonModule],
  templateUrl: './product-showcase.component.html',
  styleUrls: ['./product-showcase.component.css']
})
export class ProductShowcaseComponent {
  products = [
    {
      title: "Add to Poha",
      description: "Mix seamlessly with your morning poha"
    },
    {
      title: "Add to Roti",
      description: "Mix it in your roti!"
    },
    {
      title: "Blend with any food",
      description: "Versatile protein for any meal"
    },
    {
      title: "Add to eve snacks",
      description: "Perfect for evening nutrition"
    }
  ];
}
