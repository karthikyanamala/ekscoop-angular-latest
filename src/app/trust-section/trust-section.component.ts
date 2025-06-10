import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-trust-section',
  imports:[CommonModule],
  templateUrl: './trust-section.component.html',
  styleUrls: ['./trust-section.component.css'],
  standalone: true
})
export class TrustSectionComponent {
  reports = [
    {
      icon: 'lucide:shield-check',
      color: 'text-green-600',
      title: 'Heavy Metal Testing',
      description:
        'Our protein powder is rigorously tested for heavy metals including lead, mercury, cadmium, and arsenic to ensure your safety and peace of mind.',
      reportType: 'Heavy Metal Report'
    },
    {
      icon: 'lucide:file-text',
      color: 'text-blue-600',
      title: 'Nutritional Analysis',
      description:
        'Complete nutritional breakdown verified by third-party labs, confirming protein content, amino acid profile, and macro/micronutrient accuracy.',
      reportType: 'Nutritional Report'
    },
    {
      icon: 'lucide:award',
      color: 'text-purple-600',
      title: 'Moisture Content',
      description:
        'Moisture testing ensures optimal product quality, freshness, and shelf life while preventing bacterial growth and maintaining nutritional integrity.',
      reportType: 'Moisture Report'
    }
  ];

  handleReportClick(reportType: string): void {
    alert(`Opening ${reportType}`); // Replace with actual logic
  }
}
