import {
  Component,
  OnInit,
  ViewEncapsulation,
  Inject,
  PLATFORM_ID,
  HostListener,
  OnDestroy,
  Renderer2,
} from '@angular/core';
import {
  isPlatformBrowser,
  isPlatformServer,
  DOCUMENT,
  CommonModule,
} from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

// ✅ Use the lite build for the web bundle
import {algoliasearch} from 'algoliasearch';
import instantsearch from 'instantsearch.js';
import {
  searchBox,
  configure,
  infiniteHits,
} from 'instantsearch.js/es/widgets';

import { environment } from '../../../environments/environment';
import { AskQuestionComponent } from '../ask-question/ask-question.component';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { ProductShowcaseComponent } from '../../home/product-showcase/product-showcase.component';
import { RouterLink } from '@angular/router';
import { ProfileComponent } from '../../profile/profile.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    AskQuestionComponent,
    CommonModule,
    ProductShowcaseComponent,
    RouterLink,
    ProfileComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css'],
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  private search!: any;
  showAsk = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private firestore: Firestore,
    private title: Title,
    private meta: Meta,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  // ---------- lifecycle ----------
  ngOnInit(): void {
    // Base SEO tags for the Community page (rendered on SSR too)
    this.setSeoForCommunity();

    if (isPlatformBrowser(this.platformId)) {
      this.initSearch();
    }
  }

  ngOnDestroy(): void {
    try {
      this.search?.dispose?.();
    } catch {}
    if (isPlatformBrowser(this.platformId)) this.document.body.style.overflow = '';
  }

  // ---------- modal helpers ----------
  openAsk() {
    this.showAsk = true;
    if (isPlatformBrowser(this.platformId)) this.document.body.style.overflow = 'hidden';
  }
  closeAsk() {
    this.showAsk = false;
    if (isPlatformBrowser(this.platformId)) this.document.body.style.overflow = '';
  }
  @HostListener('document:keydown.escape') onEsc() {
    if (this.showAsk) this.closeAsk();
  }
  onAskPosted() {
    try {
      this.search?.helper?.search?.();
    } catch {}
    this.closeAsk();
  }

  // ---------- Algolia / hits ----------
  private initSearch() {
    const searchClient = algoliasearch(
      environment.algolia.appId,
      environment.algolia.apiKey
    );

    this.search = instantsearch({
      indexName: environment.algolia.indexName,
      searchClient,
    });

    this.search.addWidgets([
      searchBox({
        container: '#searchbox',
        placeholder: 'Search protein questions…',
        showReset: false,
        showSubmit: false,
        cssClasses: { root: 'gl-searchBox', input: 'gl-searchInput' },
      }),
      configure({ hitsPerPage: 7 }),

      infiniteHits({
        container: '#hits',
        showPrevious: false,
        cssClasses: {
          root: 'gl-infiniteHits',
          list: 'gl-hitsList',
          item: 'gl-hitItem',
          loadMore: 'gl-loadMore',
          disabledLoadMore: 'gl-loadMore gl-loadMore--disabled',
        },
        templates: {
          showMoreText: 'Load more results',
          item: (hit: any) => {
            const title = hit.title || '';
            const description = hit.description || '';
            const tags = Array.isArray(hit.tags) ? hit.tags : [];
            const views = hit.views || 0;
            const answers = hit.answersCount || 0;
            const slug = encodeURIComponent(hit.slug || '');
            const id = hit.objectID;
            const tagHTML = tags.map((t: string) => `<span class="tag-pill">${t}</span>`).join(' ');
            const likes = hit.likes || 0;
            const dislikes = hit.dislikes || 0;
            const reports = hit.reports || 0;

            return `
              <a id="q-${id}" href="/questions/${slug}" class="result-card-link">
                <div class="result-card">
                  <div class="result-header">
                    <div class="pill">💬 ${answers} answers</div>
                    <div class="pill">👀 ${views} views</div>
                  </div>
                  <h3 class="result-title">${title}</h3>
                  <p class="result-description">${description}</p>
                  <div class="result-tags">${tagHTML}</div>
                  <div class="result-footer">
                    <div class="author-info">👤 Anonymous</div>
                    <div>🕒 Recently</div>
                  </div>
                  <div class="result-actions">
                    <button class="btn-like">👍 ${likes}</button>
                    <button class="btn-dislike">👎 ${dislikes}</button>
                    <button class="btn-report">🚩 Report (${reports})</button>
                  </div>
                </div>
              </a>
            `;
          },
        },
        transformItems: (items) => {
          // 1) Rehydrate counts from Firestore (optional)
          setTimeout(() => {
            items.forEach(async (hit: any) => {
              try {
                const snap = await getDoc(doc(this.firestore, `QUESTIONS_PATH/${hit.objectID}`));
                if (!snap.exists()) return;
                const data = snap.data();
                const el = this.document.getElementById(`q-${hit.objectID}`);
                if (!el) return;
                (el.querySelector('.btn-like') as HTMLElement | null)!.innerHTML = `👍 ${data['likes'] || 0}`;
                (el.querySelector('.btn-dislike') as HTMLElement | null)!.innerHTML = `👎 ${data['dislikes'] || 0}`;
                (el.querySelector('.btn-report') as HTMLElement | null)!.innerHTML = `🚩 Report (${data['reports'] || 0})`;
              } catch {
                /* ignore */
              }
            });
          }, 0);

          // 2) Update ItemList JSON-LD for the first 10 visible results
          try {
            const top = items.slice(0, 10).map((h: any, i: number) => {
              const slugOrId = encodeURIComponent(h.slug || h.objectID);
              const url = `https://ekscoop.com/questions/${slugOrId}`;
              return {
                '@type': 'ListItem',
                position: i + 1,
                url,
                item: {
                  '@type': 'DiscussionForumPosting',
                  headline: h.title || '',
                  url,
                  upvoteCount: h.likes || 0,
                  commentCount: h.answersCount || 0,
                },
              };
            });

            const itemList = {
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: 'Top Community Questions',
              itemListElement: top,
            };

            this.setJsonLd('jsonld-community', itemList);
          } catch {
            /* ignore */
          }

          return items;
        },
      }) as any,
    ]);

    this.search.start();
  }

  // ---------- SEO helpers ----------
  private setSeoForCommunity() {
    const title = 'Community Questions | ekScoop';
    const desc =
      'Learn from real questions about YOU x 0.8 plant protein — mixing tips, results, and nutrition insights shared by the community.';

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: desc });
    this.meta.updateTag({ name: 'robots', content: 'index,follow' });

    // Open Graph / Twitter
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: desc });
    this.meta.updateTag({ property: 'og:url', content: 'https://ekscoop.com/community' });
    this.meta.updateTag({ property: 'og:image', content: 'https://ekscoop.com/assets/social-preview.jpg' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: desc });
    this.meta.updateTag({ name: 'twitter:image', content: 'https://ekscoop.com/assets/social-preview.jpg' });

    this.setCanonical('https://ekscoop.com/community');

    // SSR placeholder ItemList so bots see a valid schema even if JS is off
    if (isPlatformServer(this.platformId)) {
      const placeholder = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Top Community Questions',
        itemListElement: [],
      };
      this.setJsonLd('jsonld-community', placeholder);
    }
  }

  private setCanonical(url: string) {
    const head = this.document.head;
    let link: HTMLLinkElement | null = head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.renderer.createElement('link');
      this.renderer.setAttribute(link, 'rel', 'canonical');
      this.renderer.appendChild(head, link);
    }
    this.renderer.setAttribute(link, 'href', url);
  }

  // ✅ Safe JSON-LD “upsert” (no strict-null errors)
  private setJsonLd(id: string, data: any) {
    const head = this.document.head;
    const json = JSON.stringify(data);

    let script = head.querySelector<HTMLScriptElement>(`script#${id}[type="application/ld+json"]`);
    if (script) {
      this.renderer.setProperty(script, 'text', json);
      return;
    }

    script = this.renderer.createElement('script') as HTMLScriptElement;
    this.renderer.setAttribute(script, 'type', 'application/ld+json');
    this.renderer.setAttribute(script, 'id', id);
    this.renderer.setProperty(script, 'text', json);
    this.renderer.appendChild(head, script);
  }

  // ---------- shop/benefits overlays (unchanged) ----------
  showShop = false;
  openShop() {
    this.showShop = true;
    if (typeof document !== 'undefined') this.document.body.style.overflow = 'hidden';
  }
  closeShop() {
    this.showShop = false;
    if (typeof document !== 'undefined') this.document.body.style.overflow = '';
  }

  showBenefits = false;
  openBenefits() {
    this.showBenefits = true;
    if (typeof document !== 'undefined') this.document.body.style.overflow = 'hidden';
  }
  closeBenefits() {
    this.showBenefits = false;
    if (typeof document !== 'undefined') this.document.body.style.overflow = '';
  }
}
