import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const cardStagger = trigger('cardStagger', [
  transition(':enter', [
    query('.narrative-block', [
      style({ opacity: 0, transform: 'translateY(30px)' }),
      stagger(120, [
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ], { optional: true })
  ])
]);
