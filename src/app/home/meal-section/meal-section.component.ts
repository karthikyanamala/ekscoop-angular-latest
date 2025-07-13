import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Meal {
  title: string;
  subtitle: string;
  icon: string;
  mainText: string;
  description: string;
  features: string[];
  bgColor: string;
}

interface UsageInstruction {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-meal-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meal-section.component.html',
  styleUrls: ['./meal-section.component.css']
})
export class MealSectionComponent {
  selectedMeal: string = 'breakfast';
  showModal: boolean = false;

  // Define the order here
  mealOrder: string[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

  meals: Record<string, Meal> = {
    breakfast: {
      title: 'Breakfast',
      subtitle: 'Morning',
      icon: '🌅',
      mainText: 'Use YOU x 0.8 with your breakfast',
      description: 'Mix YOU x 0.8 into every bowl. Kick start your day with perfect protein!',
      features: [
        'Best with idly, dosa, poha or any breakfast',
        'Gentle on stomach, strong on nutrition'
      ],
      bgColor: 'linear-gradient(to right, #ffe29f, #ffa99f)'
    },
    lunch: {
      title: 'Lunch',
      subtitle: 'Afternoon',
      icon: '🍽️',
      mainText: 'Power up your lunch meals',
      description: 'Add YOU x 0.8 to rice, dal, and curries for sustained energy.',
      features: [
        'Perfect with rice, dal, and sambar',
        'Maintains energy levels all day'
      ],
      bgColor: 'linear-gradient(to right, #d4fc79, #96e6a1)'
    },
    snacks: {
      title: 'Snacks',
      subtitle: 'Evening',
      icon: '🍪',
      mainText: 'Transform your evening snacks',
      description: 'Mix into chapati dough, upma, or any evening snack for added nutrition.',
      features: [
        'Great with chapati, upma, and evening snacks',
        'No taste change, maximum nutrition'
      ],
      bgColor: 'linear-gradient(to right, #e0c3fc, #8ec5fc)'
    },
    dinner: {
      title: 'Dinner',
      subtitle: 'Night',
      icon: '🌙',
      mainText: 'Complete your day with protein',
      description: 'Add YOU x 0.8 to your dinner for overnight muscle recovery.',
      features: [
        'Perfect with roti, rice, and curry',
        'Supports overnight muscle recovery'
      ],
      bgColor: 'linear-gradient(to right, #a1c4fd, #c2e9fb)'
    }
  };

  usageInstructions: UsageInstruction[] = [
    { icon: '🥞', title: 'For Dosa/Idli', description: 'Mix YOU x 0.8 into your dosa or idli batter.' },
    { icon: '🍲', title: 'For Poha', description: 'Add towards the end — just before turning off the stove.' },
    { icon: '🍛', title: 'For Upma', description: 'Stir in during final minutes of cooking.' },
    { icon: '🍚', title: 'For Sambar/Rasam', description: 'Mix protein after boiling.' },
    { icon: '🍘', title: 'For Curd Rice', description: 'Blend it with curd before mixing rice.' },
    { icon: '🫓', title: 'For Chapati', description: 'Add to dough while kneading. No one will notice!' }
  ];

  selectMeal(mealKey: string): void {
    this.selectedMeal = mealKey;
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }
}
