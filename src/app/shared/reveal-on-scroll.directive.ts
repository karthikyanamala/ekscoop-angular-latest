import { Directive, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appRevealOnScroll]',
  standalone: true,
})
export class RevealOnScrollDirective implements OnInit, OnDestroy {
  private io?: IntersectionObserver;
  private isBrowser = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    const node = this.el.nativeElement;

    // Server-side render: no IntersectionObserver, just show immediately.
    if (!this.isBrowser) {
      node.classList.add('reveal-in');
      return;
    }

    // Browser: set initial hidden style then observe
    node.classList.add('reveal');

    const IO = (window as any).IntersectionObserver as typeof IntersectionObserver | undefined;
    if (!IO) {
      // Older browsers: reveal on next frame without observer
      requestAnimationFrame(() => node.classList.add('reveal-in'));
      return;
    }

    this.io = new IO((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          node.classList.add('reveal-in');
          this.io?.unobserve(node);
          break;
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 });

    this.io.observe(node);
  }

  ngOnDestroy() {
    this.io?.disconnect();
  }
}
