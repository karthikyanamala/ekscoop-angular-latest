import "zone.js/node";
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";
import { renderApplication } from "@angular/platform-server";
import { bootstrapApplication } from "@angular/platform-browser";

import { AppComponent } from "./app/app.component";
import { appConfig } from "./main.config";

// ✅ GCS import
import { Storage } from "@google-cloud/storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BROWSER_FOLDER = join(__dirname, "../dist/ekscoop/browser");
const INDEX_HTML = join(BROWSER_FOLDER, "index.html");
const PORT = process.env["PORT"] || 4000;

const app = express();

/* ----------------------------- Cloud Storage ----------------------------- */

// ❓ Pick ONE of these two ways:

// A) Hardcode bucket (simple; you asked for this)
const BUCKET_NAME = "ekscoop.appspot.com";

// B) Or env fallback (handy if you ever have staging/prod)
// const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "ekscoop";
// const BUCKET_NAME = `${projectId}.appspot.com`;

const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);
const ALL_Q_PATH = "browse/all-questions.html"; // the file your function writes

// Health check (optional)
app.get("/_ah/health", (_req, res) => res.status(200).send("ok"));

/* ------------------------------ Static Files ----------------------------- */

// Serve static files like JS/CSS/assets
app.use(express.static(BROWSER_FOLDER, { index: false }));

// Block known bot routes
app.get("/.well-known/*", (_req, res) => res.status(404).send("Not found"));
app.get("*.json", (_req, res) => res.status(404).send("Not found"));

/* ----------------------- All-questions (from GCS) ------------------------ */
/**
 * Streams the auto-updating HTML from Cloud Storage.
 * No redeploy needed when content changes.
 */
app.get("/all-questions", async (_req, res) => {
  try {
    const file = bucket.file(ALL_Q_PATH);
    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).send("All-questions page not built yet.");
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.setHeader("Cache-Control", "public, max-age=60"); // ~1 minute
    file.createReadStream()
      .on("error", (e) => {
        console.error("Stream error /all-questions:", e);
        res.status(500).end();
      })
      .pipe(res);
  } catch (e) {
    console.error("Serve /all-questions error:", e);
    res.status(500).send("Error serving all-questions.");
  }
});

/* ---------------------------------- SSR ---------------------------------- */

// All other routes → SSR
app.get("*", async (req, res) => {
  try {
    const document = await readFile(INDEX_HTML, "utf-8");
    const html = await renderApplication(
      () => bootstrapApplication(AppComponent, appConfig),
      { document, url: req.originalUrl }
    );
    res.status(200).send(html);
  } catch (err) {
    console.error("❌ SSR render error:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`✅ SSR server running at http://localhost:${PORT}`);
  console.log(`🪣 Using bucket: ${BUCKET_NAME}`);
  console.log(`🗂️  GCS file for all-questions: gs://${BUCKET_NAME}/${ALL_Q_PATH}`);
});
