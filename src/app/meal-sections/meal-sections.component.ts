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

    this.metaService.addTags([
      {
        name: 'description',
        content:
          'Learn how to mix YOU x 0.8 unflavoured plant protein into Indian meals like roti, dal, poha, and curd. Ideal for breakfast, lunch, snacks, and dinner. No taste change, just extra strength.'
      },
      {
        name: 'keywords',
        content:
          'protein for roti, dal protein, poha protein mix, curd protein, plant protein for Indian food, vegan protein with meals, how to add protein to food, high protein Indian food, YOU x 0.8 sachet, ekScoop meal guide, gym supplements with Indian food, unflavoured protein for rice, lentil protein boost'
      },
      {
        property: 'og:title',
        content: 'How to Add ekScoop Protein to Your Indian Meals'
      },
      {
        property: 'og:description',
        content:
          'Mix YOU x 0.8 into your regular meals without affecting taste. Protein for roti, dal, curd, poha, upma, and more. Easy. Diabetic-friendly. Zero sugar.'
      },
      {
        property: 'og:url',
        content: 'https://ekscoop.com/meal-section'
      },
      {
        name: 'robots',
        content: 'index, follow'
      }
    ]);
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
