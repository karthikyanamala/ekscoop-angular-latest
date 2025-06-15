import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-mode',
  imports:[CommonModule],
  templateUrl: './product-mode.component.html',
  styleUrls: ['./product-mode.component.css'],
  animations: [
    trigger('fadeZoom', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ]
})
export class ProductModeComponent {
  modes = ['Family', 'Feminine', 'Gym', 'Health'];
  activeMode = 'Family';

  getImage(mode: string): string {
    return `assets/${mode.toLowerCase()}-mode.png`;
  }

  getDescription(mode: string): string {
    const desc: Record<string, string> = {
      Family: `Most young people today are aware of protein and its benefits — gym-goers, college students, fitness lovers. But what about your mom, dad, or grandparents? Are they getting enough protein daily? Their meals often miss the mark, and it's our duty to help them stay strong too. That’s why YOU x 0.8 is perfect for families — just mix it into dal, roti dough, or curd. It doesn’t change the taste but gives them the essential protein they need every day. Let’s make our loved ones stronger, one scoop at a time.`,
      Feminine: `Women take care of everyone — cooking, working, managing homes, raising families — but often forget to take care of themselves. Are your mother, wife, or sister getting enough protein to stay strong and healthy? Most Indian women silently miss their daily protein needs, leading to fatigue, weakness, and long-term health issues. With YOU x 0.8, fulfilling their daily protein is simple — just mix it into regular food like dal, roti, or curd. No taste change, no extra work. It’s time we care for the women who care for us — let’s build their strength, one scoop at a time.`,
      Gym: `You train hard. You push limits. But are you supporting your muscles with the protein they truly need? Whether you're lifting, running, or chasing fitness goals — your body demands more. Don’t let everyday meals fall short. YOU x 0.8 delivers clean, unflavoured protein that blends right into your food — no powders, no shakes, no excuses. Add it to roti, dal, or poha — fuel recovery, build lean muscle, and show up stronger every day. No heavy metals. No fake flavors. Just pure power in every scoop.`,
      Health: `Good health isn’t about pills or extreme diets — it’s about daily habits. Most Indians unknowingly miss their daily protein needs, leading to low immunity, weakness, and slower recovery. Whether you're young or old, managing diabetes or just focusing on better wellness, YOU x 0.8 fits right in. It's diabetic-friendly, gentle on digestion, and completely tasteless — so your food stays the same, but your health gets better. Just stir it in. Stay strong. Stay consistent. Real health starts with real protein.`
    };
    return desc[mode];
  }

  setMode(mode: string) {
    this.activeMode = mode;
  }
}
