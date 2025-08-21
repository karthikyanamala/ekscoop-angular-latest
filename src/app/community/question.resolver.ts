import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { isPlatformServer } from '@angular/common';

type QuestionMetaResponse = {
  title: string;
  description: string;
  slug: string;
  createdAtISO?: string;
  likes?: number;
  answersCount?: number;
};

@Injectable({ providedIn: 'root' })
export class QuestionResolver implements Resolve<any> {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async resolve(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {
    const slug = route.paramMap.get('slug');
    if (!slug) return null;

    if (isPlatformServer(this.platformId)) {
      try {
        const res = await fetch(
          `https://us-central1-ekscoop-website.cloudfunctions.net/getQuestionMeta?slug=${encodeURIComponent(slug)}`
        );
        if (!res.ok) throw new Error(`Meta fetch failed: ${res.status}`);
        const meta = (await res.json()) as QuestionMetaResponse;

        // Minimal QAPage JSON-LD – no accepted/best answer
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'QAPage',
          mainEntity: {
            '@type': 'Question',
            name: meta.title,
            text: meta.description,
            dateCreated: meta.createdAtISO || undefined,
            upvoteCount: meta.likes ?? 0,
            answerCount: meta.answersCount ?? 0
          }
        };

        return {
          id: 'meta-ssr',
          meta: {
            title: meta.title,
            description: meta.description,
            image: 'https://ekscoop.com/assets/social-preview.jpg',
            url: `https://ekscoop.com/questions/${slug}`
          },
          canonical: `https://ekscoop.com/questions/${slug}`,
          robots: 'index,follow',
          jsonLd
        };
      } catch {
        return {
          id: 'fallback',
          meta: {
            title: 'YOU x 0.8 | Question',
            description: 'Explore how YOU x 0.8 fits into Indian meals.',
            image: 'https://ekscoop.com/assets/social-preview.jpg',
            url: `https://ekscoop.com/questions/${slug}`
          },
          canonical: `https://ekscoop.com/questions/${slug}`,
          robots: 'index,follow',
          jsonLd: null
        };
      }
    }

    // Browser init data (component will refine)
    return {
      id: 'browser',
      meta: {
        title: 'Loading…',
        description: '',
        image: 'https://ekscoop.com/assets/social-preview.jpg',
        url: `https://ekscoop.com/questions/${slug}`
      },
      canonical: `https://ekscoop.com/questions/${slug}`,
      robots: 'index,follow',
      jsonLd: null
    };
  }
}
