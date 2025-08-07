import 'zone.js/node';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { renderApplication } from '@angular/platform-server';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './main.config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BROWSER_FOLDER = join(__dirname, '../dist/ekscoop/browser');
const INDEX_HTML = join(BROWSER_FOLDER, 'index.html');
const PORT = process.env['PORT'] || 4000;

const app = express();

// Serve static files like JS/CSS/assets
app.use(express.static(BROWSER_FOLDER, { index: false }));

// Block known bot routes
app.get('/.well-known/*', (_, res) => res.status(404).send('Not found'));
app.get('*.json', (_, res) => res.status(404).send('Not found'));

// All other routes → SSR
app.get('*', async (req, res) => {
  try {
    const document = await readFile(INDEX_HTML, 'utf-8');
    const html = await renderApplication(() => bootstrapApplication(AppComponent, appConfig), {
      document,
      url: req.originalUrl,
    });
    res.status(200).send(html);
  } catch (err) {
    console.error('❌ SSR render error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`✅ SSR server running at http://localhost:${PORT}`);
});
