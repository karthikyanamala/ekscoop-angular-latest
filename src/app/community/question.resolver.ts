import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { isPlatformServer } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class QuestionResolver implements Resolve<any> {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const slug = route.paramMap.get('slug');
    if (!slug) return null;

    // ✅ SSR: Fetch meta only using Cloud Function
    if (isPlatformServer(this.platformId)) {
      try {
        const response = await fetch(
          `https://us-central1-ekscoop-website.cloudfunctions.net/getQuestionMeta?slug=${slug}`
        );
        if (!response.ok) throw new Error('Meta fetch failed');

        const meta = await response.json();

        return {
          id: 'meta-ssr',
          meta: {
            title: meta.title,
            description: meta.description,
            image: 'https://ekscoop.com/assets/social-preview.jpg',
            url: `https://ekscoop.com/questions/${slug}`
          }
        };
      } catch (err) {
        console.warn('[SSR META] Fallback due to error:', err);
        return {
          id: 'fallback',
          meta: {
            title: 'YOU x 0.8 | Question',
            description: 'Explore how YOU x 0.8 fits into Indian meals.',
            image: 'https://ekscoop.com/assets/social-preview.jpg',
            url: `https://ekscoop.com/questions/${slug}`
          }
        };
      }
    }

    // ✅ Browser: no meta call here — handled in component (less Firestore usage)
    return {
      id: 'browser',
      meta: {
        title: 'Loading...',
        description: '',
        image: 'https://ekscoop.com/assets/social-preview.jpg',
        url: `https://ekscoop.com/questions/${slug}`
      }
    };
  }
}
