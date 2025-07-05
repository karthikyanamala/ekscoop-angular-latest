import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-features',
  imports:[CommonModule],
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css']
})
export class FeaturesComponent {
  features = [
    {
      title: "Morning Power",
      description: "Best with idly, dosa, poha or any breakfast",
      time: "Breakfast",
      gradient: "from-yellow-400 to-orange-500",
      icon: "🌅"
    },
    {
      title: "Afternoon Energy",
      description: "Maintains energy levels throughout the day",
      time: "Lunch",
      gradient: "from-green-400 to-teal-500",
      icon: "🍽️"
    },
    {
      title: "Evening Boost",
      description: "Transform evening snacks into protein-rich treats",
      time: "Snacks",
      gradient: "from-purple-400 to-pink-500",
      icon: "🍪"
    },
    {
      title: "Night Recovery",
      description: "Supports muscle recovery and better sleep quality",
      time: "Dinner",
      gradient: "from-blue-400 to-purple-500",
      icon: "🌙"
    }
  ];
}
