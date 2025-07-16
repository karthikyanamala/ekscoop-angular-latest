import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [RouterModule,CommonModule],
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent {
  blogs = [
    {
      title: 'How to Add Protein to Poha Without Changing Taste',
      slug: 'protein-for-poha',
      image: 'assets/blog/poha-protein.jpg',
      description: 'Learn how YOU x 0.8 makes your breakfast more powerful, without changing flavor.',
      date: 'July 2025'
    },
    {
      title: 'Dal + Roti = Protein? Not Quite.',
      slug: 'dal-roti-protein',
      image: 'assets/blog/dal-roti.jpg',
      description: 'Think dal-roti gives you enough protein? Read the science behind the myth.',
      date: 'July 2025'
    },
    {
      title: 'Best Plant-Based Protein for Indian Moms',
      slug: 'protein-for-indian-moms',
      image: 'assets/blog/mother-protein.jpg',
      description: 'Why Indian mothers are unknowingly low on protein—and how to fix it.',
      date: 'Coming Soon'
    },
     {
      title: 'Is Curd Rice Missing Protein?',
      slug: 'curd-rice-protein-gap',
      image: 'assets/blog/curd-rice.jpg',
      description: 'Discover how curd rice, though tasty, may lack complete protein—and how YOU x 0.8 can help.',
      date: 'Coming Soon'
    },
    {
      title: 'Chutney, Idly, Dosa: Protein Boost for South Meals',
      slug: 'chutney-idly-dosa',
      image: 'assets/blog/south-meals.jpg',
      description: 'Learn how YOU x 0.8 can complete your South Indian breakfast with plant protein.',
      date: 'Coming Soon'
    },
    {
      title: 'Why Active Indians Are Still Protein Deficient',
      slug: 'active-indians-protein-deficit',
      image: 'assets/blog/active-protein.jpg',
      description: 'Even active people—walkers, cyclists, gym-goers—often don’t hit their protein goals. Here’s why.',
      date: 'Coming Soon'
    }
  ];
}
