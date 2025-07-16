import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blog-detail.component.html'
})
export class BlogDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  slug: string = '';
  title: string = '';
  content: SafeHtml = '';

  posts: Record<string, { title: string, content: string, jsonld: any }> = {
    'protein-for-poha': {
      title: 'Protein for Poha? Yes, It Works!',
      content: `
        <p>Poha is light, tasty, and filling — but not protein-rich. Just 1g protein per 100g dry poha.</p>
        <p>Add a scoop of YOU x 0.8 during lemon splash or tempering. More protein, same taste.</p>
      `,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "Protein for Poha? Yes, It Works!",
        "author": { "@type": "Organization", "name": "ekScoop" },
        "datePublished": "2025-07-16",
        "mainEntityOfPage": "https://ekscoop.com/blog/protein-for-poha"
      }
    },
    'dal-roti-incomplete': {
      title: 'Dal + Roti ≠ Complete Protein',
      content: `
        <p>Dal and roti are staples, but don’t provide all amino acids.</p>
        <p>Use YOU x 0.8 to fill the protein gap in every meal, without taste compromise.</p>
      `,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "Dal + Roti ≠ Complete Protein",
        "author": { "@type": "Organization", "name": "ekScoop" },
        "datePublished": "2025-07-16",
        "mainEntityOfPage": "https://ekscoop.com/blog/dal-roti-incomplete"
      }
    },
    'protein-for-indian-moms': {
      title: 'Best Plant-Based Protein for Indian Moms',
      content: `
        <p>Most Indian moms eat less protein due to dietary patterns.</p>
        <p>One scoop of YOU x 0.8 with regular food can restore daily balance easily.</p>
      `,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "Best Plant-Based Protein for Indian Moms",
        "author": { "@type": "Organization", "name": "ekScoop" },
        "datePublished": "2025-07-16",
        "mainEntityOfPage": "https://ekscoop.com/blog/protein-for-indian-moms"
      }
    },
    'curd-rice-protein-gap':{
  title: 'Curd Rice is Comfort, Not Protein',
  content: `
    <p>Curd rice cools your system, but barely adds protein — just 3–4g per meal.</p>
    <p>Stir 1 scoop of YOU x 0.8 into the curd before mixing rice. No change in taste. Big upgrade in strength.</p>
  `,
  jsonld: {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "Curd Rice is Comfort, Not Protein",
    "author": { "@type": "Organization", "name": "ekScoop" },
    "datePublished": "2025-07-16",
    "mainEntityOfPage": "https://ekscoop.com/blog/curd-rice-protein-gap"
  }
},
'chutney-idly-dosa':{
  title: 'Chutney, Idly, Dosa — Low on Protein?',
  content: `
    <p>Breakfast favorites like idly, dosa, and chutney are low in protein. Even a full plate gives just 4–5g protein.</p>
    <p>Add YOU x 0.8 to coconut chutney or sambar to close the gap. It blends without changing flavor.</p>
  `,
  jsonld: {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "Chutney, Idly, Dosa — Low on Protein?",
    "author": { "@type": "Organization", "name": "ekScoop" },
    "datePublished": "2025-07-16",
    "mainEntityOfPage": "https://ekscoop.com/blog/chutney-idly-dosa"
  }
},
'active-indians-protein-deficit':{
  title: 'Active Indians, Silent Protein Deficit',
  content: `
    <p>Many young Indians are active — cycling, dancing, working long hours. But their diets fall short on protein.</p>
    <p>YOU x 0.8 makes it easy to add strength to your day without buying fancy powders or drinking shakes.</p>
  `,
  jsonld: {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "Active Indians, Silent Protein Deficit",
    "author": { "@type": "Organization", "name": "ekScoop" },
    "datePublished": "2025-07-16",
    "mainEntityOfPage": "https://ekscoop.com/blog/active-indians-protein-deficit"
  }
}

    
  };

 shareUrl: string = '';

ngOnInit(): void {
  this.slug = this.route.snapshot.paramMap.get('slug') || '';
  const post = this.posts[this.slug];

  if (post) {
    this.title = post.title;
    this.content = this.sanitizer.bypassSecurityTrustHtml(post.content);

    this.shareUrl = `https://ekscoop.com/blog/${this.slug}`;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(post.jsonld);
    document.head.appendChild(script);
  }
}

}
