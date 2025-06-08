import { Component } from '@angular/core';

@Component({
  selector: 'app-ekscoop-loader',
  templateUrl: './ekscoop-loader.component.html',
  styleUrls: ['./ekscoop-loader.component.css']
})
export class EkscoopLoaderComponent {
  loadingMessages: string[] = [
    "🥤 Scooping up nearby shops...",
    "💪 Flexing our search muscles...",
    "🔍 Hunting for protein treasures...",
    "⚡ Energizing the results...",
    "🎯 Targeting the best deals...",
    "🏃‍♂️ Running to find shops...",
    "🧬 Mixing the perfect results..."
  ];
  randomMessage = this.loadingMessages[Math.floor(Math.random() * this.loadingMessages.length)];
}
