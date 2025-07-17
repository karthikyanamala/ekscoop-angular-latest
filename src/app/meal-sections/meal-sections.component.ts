import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { CornerBadgeComponent } from '../corner-badge/corner-badge.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-meal-sections',
  standalone: true,
  imports: [CommonModule, CornerBadgeComponent, FooterComponent],
  templateUrl: './meal-sections.component.html',
  styleUrls: ['./meal-sections.component.css'],
})
export class MealSectionsComponent implements OnInit {
  visibleMeals: Record<string, boolean> = {
    breakfast: false,
    lunch: false,
    snacks: false,
    dinner: false,
  };

  constructor(private titleService: Title, private metaService: Meta) {}

  ngOnInit(): void {
    this.titleService.setTitle(
      'Add Protein to Roti, Dal, Curd, Poha | Indian Meals with ekScoop'
    );

    this.metaService.updateTag({
      name: 'description',
      content:
        'Learn how to mix YOU x 0.8 unflavoured plant protein into Indian meals like roti, dal, poha, and curd. Ideal for breakfast, lunch, snacks, and dinner. No taste change, just extra strength.'
    });

    this.metaService.updateTag({
      name: 'keywords',
      content:
        'protein for roti, dal protein, poha protein mix, curd protein, plant protein for Indian food, vegan protein with meals, how to add protein to food, high protein Indian food, YOU x 0.8 sachet, ekScoop meal guide, gym supplements with Indian food, unflavoured protein for rice, lentil protein boost'
    });

    this.metaService.updateTag({
      property: 'og:title',
      content: 'How to Add ekScoop Protein to Your Indian Meals'
    });

    this.metaService.updateTag({
      property: 'og:description',
      content: 'Mix YOU x 0.8 into your regular meals without affecting taste. Protein for roti, dal, curd, poha, upma, and more. Easy. Diabetic-friendly. Zero sugar.'
    });

    this.metaService.updateTag({
      property: 'og:url',
      content: 'https://ekscoop.com/meal-section'
    });

    this.metaService.updateTag({
      property: 'og:type',
      content: 'article'
    });

    this.metaService.updateTag({
      name: 'robots',
      content: 'index, follow'
    });

    this.metaService.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });

    this.metaService.updateTag({
      name: 'twitter:title',
      content: 'How to Add ekScoop Protein to Indian Meals'
    });

    this.metaService.updateTag({
      name: 'twitter:description',
      content: 'Mix YOU x 0.8 into roti, dal, curd, poha. No taste change. Pure strength.'
    });

    this.metaService.updateTag({
      name: 'twitter:image',
      content: 'https://ekscoop.com/assets/blog/poha-protein.jpg'
    });

    // Canonical tag
    const link: HTMLLinkElement = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', 'https://ekscoop.com/meal-section');
    document.head.appendChild(link);
  }

  toggleMeal(mealId: string) {
    this.visibleMeals[mealId] = !this.visibleMeals[mealId];
  }

  showRecipe(mealId: string) {
    this.visibleMeals[mealId] = true;
    console.log('button clicked');
    setTimeout(() => {
      const element = document.getElementById(`${mealId}-recipe`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  hideRecipe(mealId: string) {
    this.visibleMeals[mealId] = false;
  }
}
