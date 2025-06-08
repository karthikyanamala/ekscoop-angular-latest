import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CornerBadgeComponent } from '../corner-badge/corner-badge.component';
@Component({
  selector: 'app-meal-sections',
  imports:[CommonModule,CornerBadgeComponent],
  templateUrl: './meal-sections.component.html',
  styleUrls: ['./meal-sections.component.css'],
})
export class MealSectionsComponent {
  visibleMeals: Record<string, boolean> = {
    breakfast: false,
    lunch: false,
    snacks: false,
    dinner: false,
  };

  toggleMeal(mealId: string) {
    this.visibleMeals[mealId] = !this.visibleMeals[mealId];
  }
  showRecipe(mealId: string) {
    this.visibleMeals[mealId] = true;
    console.log("button clicked")
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