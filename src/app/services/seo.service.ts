// src/app/shared/seo.service.ts
import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';           // ✅ correct package
import { Title, Meta } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(
    private titleSrv: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  setTitle(t: string) {
    this.titleSrv.setTitle(t);
  }

  setDescription(d: string) {
    this.meta.updateTag({ name: 'description', content: d });
  }

  setCanonical(url: string) {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  setOpenGraph(opts: { title: string; description: string; url: string; image?: string }) {
    const set = (p: string, c: string) => this.meta.updateTag({ property: p, content: c });
    set('og:title', opts.title);
    set('og:description', opts.description);
    set('og:url', opts.url);
    if (opts.image) set('og:image', opts.image);
  }

  setTwitter(opts: { title: string; description: string; image?: string }) {
    const set = (n: string, c: string) => this.meta.updateTag({ name: n, content: c });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    set('twitter:title', opts.title);
    set('twitter:description', opts.description);
    if (opts.image) set('twitter:image', opts.image);
  }

  setJsonLd(json: object, id = 'ld-json') {
    let el = this.doc.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = this.doc.createElement('script');
      el.type = 'application/ld+json';
      el.id = id;
      this.doc.head.appendChild(el);
    }
    el.text = JSON.stringify(json);
  }
}
