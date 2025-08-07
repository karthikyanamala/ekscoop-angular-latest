import {
  Component,
  OnInit,
  ViewEncapsulation,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { algoliasearch } from "algoliasearch"; // ✅ as you requested
import instantsearch from 'instantsearch.js';
import { searchBox, hits, pagination } from 'instantsearch.js/es/widgets';
import { environment } from '../../../environments/environment';
import { AskQuestionComponent } from '../ask-question/ask-question.component';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-search-results',
  imports: [AskQuestionComponent],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css'],
})
export class SearchResultsComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initSearch();
    }
  }

  initSearch() {
    const searchClient = algoliasearch(
      environment.algolia.appId,
      environment.algolia.apiKey
    );

    const search = instantsearch({
      indexName: environment.algolia.indexName,
      searchClient,
      future: {
        preserveSharedStateOnUnmount: true,
      },
    });

    search.addWidgets([
      searchBox({
        container: '#searchbox',
        placeholder: 'Search protein questions...',
        showReset: true,
        showSubmit: true,
        cssClasses: {
          input: 'ais-input',
          submit: 'ais-submit',
          reset: 'ais-reset',
        },
      }),
      hits({
        container: '#hits',
        templates: {
          item(hit: any) {
            const title = hit.title || '';
            const description = hit.description || '';
            const tags = Array.isArray(hit.tags) ? hit.tags : [];
            const views = hit.views || 0;
            const upvotes = hit.upvotes || 0;
            const answers = hit.answersCount || 0;
            const slug = encodeURIComponent(hit.slug || '');
            const tagHTML = tags
              .map((tag: string) => `<span class="tag-pill">${tag}</span>`)
              .join(' ');

            return `
              <a href="/questions/${slug}" class="result-card-link">
                <div class="result-card">
                  <div class="result-header">
                    <div class="pill">⬆️ ${upvotes} votes</div>
                    <div class="pill">💬 ${answers} answers</div>
                    <div class="pill">👁️ ${views} views</div>
                  </div>
                  <h3 class="result-title">${title}</h3>
                  <p class="result-description">${description}</p>
                  <div class="result-tags">${tagHTML}</div>
                  <div class="result-footer">
                    <div class="author-info">👤 Anonymous</div>
                    <div>🕒 Recently</div>
                  </div>
                </div>
              </a>
            `;
          },
        },
      }),
      pagination({
        container: '#pagination',
        showFirst: false,
        showLast: false,
        padding: 2,
        scrollTo: '#searchbox',
      }),
    ]);

    search.start();
  }
}