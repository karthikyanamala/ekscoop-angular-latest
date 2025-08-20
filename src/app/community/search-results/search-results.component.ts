import {
  Component,
  OnInit,
  ViewEncapsulation,
  Inject,
  PLATFORM_ID,
  HostListener,
  OnDestroy,
} from '@angular/core';
import {algoliasearch} from 'algoliasearch';
import instantsearch from 'instantsearch.js';
import { searchBox, configure, infiniteHits } from 'instantsearch.js/es/widgets';
import { environment } from '../../../environments/environment';
import { AskQuestionComponent } from '../ask-question/ask-question.component';
import { isPlatformBrowser } from '@angular/common';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { ProductShowcaseComponent } from '../../home/product-showcase/product-showcase.component';
import { RouterLink } from '@angular/router';
import { ProfileComponent } from '../../profile/profile.component';
@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [AskQuestionComponent,CommonModule,ProductShowcaseComponent, RouterLink,ProfileComponent],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css'],
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  private search!: any;
  showAsk = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.initSearch();
  }

  ngOnDestroy(): void {
    try { this.search?.dispose?.(); } catch {}
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = '';
  }

  // Modal controls (if you’re using the Ask modal)
  openAsk() {
    this.showAsk = true;
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = 'hidden';
  }
  closeAsk() {
    this.showAsk = false;
    if (isPlatformBrowser(this.platformId)) document.body.style.overflow = '';
  }
  @HostListener('document:keydown.escape') onEsc() { if (this.showAsk) this.closeAsk(); }
  onAskPosted() { try { this.search?.helper?.search?.(); } catch {} this.closeAsk(); }

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
      // 🔎 Centered, clean search input (no default buttons)
      searchBox({
        container: '#searchbox',
        placeholder: 'Search protein questions…',
        showReset: false,
        showSubmit: false,
        cssClasses: {
          root: 'gl-searchBox',
          input: 'gl-searchInput',
        },
      }),

      // 7 per page always
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
          setTimeout(() => {
            items.forEach(async (hit: any) => {
              try {
                const snap = await getDoc(doc(this.firestore, `QUESTIONS_PATH/${hit.objectID}`));
                if (!snap.exists()) return;
                const data = snap.data();
                const el = document.getElementById(`q-${hit.objectID}`);
                if (!el) return;
                (el.querySelector('.btn-like') as HTMLElement | null)!.innerHTML =
                  `👍 ${data['likes'] || 0}`;
                (el.querySelector('.btn-dislike') as HTMLElement | null)!.innerHTML =
                  `👎 ${data['dislikes'] || 0}`;
                (el.querySelector('.btn-report') as HTMLElement | null)!.innerHTML =
                  `🚩 Report (${data['reports'] || 0})`;
              } catch (e) {
                console.error('Firestore hydrate error:', e);
              }
            });
          }, 0);
          return items;
        },
      }) as any,
    ]);

    this.search.start();
  }
  showShop = false;

openShop() {
  this.showShop = true;
  if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
}
closeShop() {
  this.showShop = false;
  if (typeof document !== 'undefined') document.body.style.overflow = '';
}

showBenefits = false;

openBenefits() {
  this.showBenefits = true;
  if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
}
closeBenefits() {
  this.showBenefits = false;
  if (typeof document !== 'undefined') document.body.style.overflow = '';
}

}
