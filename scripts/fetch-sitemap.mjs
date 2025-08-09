import fs from 'fs';
import https from 'https';

const sitemapUrl = 'https://us-central1-ekscoop-website.cloudfunctions.net/sitemap';
const targetPath = 'src/sitemap.xml';

const staticUrls = [
  {
    loc: 'https://ekscoop.com/',
    changefreq: 'daily',
    priority: '1.0',
  },
  {
    loc: 'https://ekscoop.com/partner-with-us',
    changefreq: 'monthly',
    priority: '0.9',
  },
  {
    loc: 'https://ekscoop.com/about-us',
    changefreq: 'yearly',
    priority: '0.7',
  },
  {
    loc: 'https://ekscoop.com/contact-us',
    changefreq: 'yearly',
    priority: '0.5',
  },
  {
    loc: 'https://ekscoop.com/meal-section',
    changefreq: 'monthly',
    priority: '0.5',
  },
  {
    loc: 'https://ekscoop.com/blog/protein-for-poha',
    changefreq: 'yearly',
    priority: '0.8',
  },
  {
    loc: 'https://ekscoop.com/blog/dal-roti-incomplete',
    changefreq: 'yearly',
    priority: '0.8',
  },
  {
    loc: 'https://ekscoop.com/blog/protein-for-indian-moms',
    changefreq: 'yearly',
    priority: '0.7',
  },
  {
    loc: 'https://ekscoop.com/blog/curd-rice-protein-gap',
    changefreq: 'yearly',
    priority: '0.7',
  },
  {
    loc: 'https://ekscoop.com/blog/chutney-idly-dosa',
    changefreq: 'yearly',
    priority: '0.7',
  },
  {
    loc: 'https://ekscoop.com/blog/active-indians-protein-deficit',
    changefreq: 'yearly',
    priority: '0.7',
  },
];

https
  .get(sitemapUrl, (res) => {
    let dynamicData = '';
    res.on('data', (chunk) => (dynamicData += chunk));
    res.on('end', () => {
      const today = new Date().toISOString().split('T')[0];

      const staticXml = staticUrls
        .map(
          (url) => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
        )
        .join('\n');

      // Extract dynamic <url>...</url> entries from remote XML
      const dynamicUrls = dynamicData.match(/<url>[\s\S]*?<\/url>/g)?.join('\n') ?? '';

      const fullXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${dynamicUrls}
</urlset>`;

      fs.writeFileSync(targetPath, fullXml, 'utf-8');
      console.log('✅ sitemap.xml updated with static + dynamic URLs');
    });
  })
  .on('error', (err) => {
    console.error('❌ Failed to fetch sitemap:', err.message);
  });
