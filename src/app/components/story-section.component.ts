import {
  Component,
  Input,
  AfterViewInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-story-section',
  imports:[CommonModule],
  standalone: true,
  templateUrl: './story-section.component.html',
  styleUrls: ['./story-section.component.css']
})
export class StorySectionComponent implements AfterViewInit {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() typewriterText: string = '';
  @Input() backgroundImage: string = '';

  @ViewChild('typewriter') typewriterEl!: ElementRef<HTMLParagraphElement>;

  ngAfterViewInit(): void {
    setTimeout(() => {
      const el = this.typewriterEl.nativeElement;
      const rect = el.getBoundingClientRect();

      if (rect.top < window.innerHeight && rect.bottom >= 0) {
        this.runTypewriterAnimation(el, this.typewriterText);
      } else {
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.runTypewriterAnimation(el, this.typewriterText);
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.3 });

        observer.observe(el);
      }
    });
  }

  private runTypewriterAnimation(element: HTMLElement, text: string) {
    element.innerHTML = '';
    let index = 0;
    const type = () => {
      if (index < text.length) {
        element.innerHTML += text.charAt(index);
        index++;
        setTimeout(type, 20);
      }
    };
    type();
  }
}
