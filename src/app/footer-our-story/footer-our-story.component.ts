import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-our-story',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer-our-story.component.html',
  styleUrls: ['./footer-our-story.component.css']
})
export class FooterOurStoryComponent implements AfterViewInit {
  @ViewChild('typewriter') typewriterEl!: ElementRef<HTMLParagraphElement>;

  fullStoryText: string = `
We didn’t start in a boardroom. We started at the dinner table.

Like millions of Indian families, we believed home-cooked food was the healthiest — dal, roti, poha, idli… simple, honest meals passed down through generations.

But something didn’t add up. Despite eating "healthy," why were so many people feeling tired, weak, or low in energy?

The answer was hidden in plain sight: protein deficiency.

That’s why we created YOU x 0.8 — a clean, neutral-tasting, plant-based protein that blends into the food you already love.

No taste. No sugar. No disruption. Just strength — one scoop at a time.
`;

  ngAfterViewInit(): void {
    const el = this.typewriterEl.nativeElement;
    el.innerHTML = '';
    let index = 0;

    const type = () => {
      if (index < this.fullStoryText.length) {
        el.innerHTML += this.fullStoryText.charAt(index);
        index++;

        // ✅ Scroll down smoothly as it types
        setTimeout(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
        }, 5);

        setTimeout(type, 35);
      }
    };

    type();
  }
}
