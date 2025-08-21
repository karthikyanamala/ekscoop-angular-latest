import {onRequest, onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";
import Razorpay from "razorpay";
import cors from "cors";
import twilio from "twilio";
import {
  onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {google, indexing_v3 as indexingV3} from "googleapis";
import {Storage} from "@google-cloud/storage";

admin.initializeApp();
const db = admin.firestore();

/** Firestore document shape */
type QuestionDoc = {
  slug?: string;
  title?: string;
  description?: string;
  answersCount?: number;
};

/** Allowed Indexing API action types */
type IndexingType = "URL_UPDATED" | "URL_REMOVED";

/**
 * Lazily create the Google Indexing API client
 *  (avoids doing auth at module load).
 */
let indexingClient: indexingV3.Indexing | null = null;
/**
 * Returns a cached Indexing API client, creating it on first use.
 * @return {Promise<indexingV3.Indexing>} Authenticated Indexing client
 */
async function getIndexingClient(): Promise<indexingV3.Indexing> {
  if (!indexingClient) {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/indexing"],
    });
    indexingClient = google.indexing({version: "v3", auth});
  }
  return indexingClient;
}

/**
 * Submit a URL to Google Indexing API.
 * @param {string} url - Full URL to index.
 * @param {IndexingType} [type=URL_UPDATED] - Indexing action type.
 */
async function submitToIndexing(
  url: string,
  type: IndexingType = "URL_UPDATED"
): Promise<void> {
  try {
    const client = await getIndexingClient();
    const res = await client.urlNotifications.publish({
      requestBody: {url, type},
    });
    console.log("✅ Indexing requested", {url, type, result: res.data});
  } catch (err: unknown) {
    console.error("❌ Indexing API error", {
      url,
      type,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Builds the full question URL from a given slug.
 * @param {string} slug - The question's unique slug.
 * @return {string} Full absolute URL to the question page.
 */
function questionUrlFromSlug(slug: string): string {
  return `https://ekscoop.com/questions/${encodeURIComponent(slug)}`;
}

// ⬆️ END OF INSERT

const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");

const corsHandler = cors({origin: true});

export const createRazorpayOrder = onRequest(
  {
    region: "us-central1",
    secrets: [razorpayKeyId, razorpayKeySecret],
  },
  (req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method !== "POST") {
          res.status(405).send({error: "Only POST requests allowed"});
          return;
        }

        const {productId, quantity} = req.body;
        const promoCode = req.headers["x-promo-code"] ?
          String(req.headers["x-promo-code"]).toUpperCase():null;

        if (!productId || typeof productId !== "string") {
          res.status(400).send({error: "Missing or invalid productId"});
          return;
        }

        if (!quantity || typeof quantity !== "number" || quantity <= 0) {
          res.status(400).send({error: "Quantity must be a positive number"});
          return;
        }

        // ✅ Fetch product price from Firestore
        const productDoc = await db.collection("products").doc(productId).get();
        if (!productDoc.exists) {
          res.status(404).send({error: "Product not found"});
          return;
        }

        const productData = productDoc.data();
        const unitPrice = productData?.price;
        if (typeof unitPrice !== "number") {
          res.status(500).send({error: "Invalid product price in database"});
          return;
        }

        let amount = unitPrice * quantity;
        let discountPercent = 0;
        let discountAmount = 0;
        let influencerName = "";

        // ✅ Validate promo if passed
        if (promoCode) {
          const promoSnap = await
          db.collection("promocodes").doc(promoCode).get();
          if (promoSnap.exists) {
            const promoData = promoSnap.data();
            if (promoData?.active === true &&
              typeof promoData?.discountPercentage === "number") {
              discountPercent = promoData.discountPercentage;
              discountAmount = Math.floor(amount * (discountPercent / 100));
              amount -= discountAmount;
              influencerName = promoData?.influencerName || "";
            } else {
              res.status(400).send({error: "Promo code inactive or invalid"});
              return;
            }
          } else {
            res.status(400).send({error: "Promo code not found"});
            return;
          }
        }

        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID ?? "",
          key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
        });

        const options = {
          amount: amount * 100, // in paise
          currency: "INR",
          receipt: `receipt_order_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        res.status(200).send({
          order,
          promo: promoCode?
            {
              promoCode,
              discountPercent,
              discountAmount,
              influencerName,
            }:
            null,
        });
      } catch (err) {
        console.error("Razorpay Order Error:", err);
        res.status(500).send({error: "Unable to create Razorpay order"});
      }
    });
  }
);

/**
 * 🔍 getQuestionMeta
 * Secure SSR-compatible endpoint to fetch question meta
 * Returns: { title, description } from Firestore where slug == :slug
 */
export const getQuestionMeta = onRequest(
  {region: "us-central1"}, async (req, res) => {
    try {
      const slug = req.query.slug;
      if (!slug || typeof slug !== "string") {
        res.status(400).json({error: "Missing or invalid slug parameter"});
        return;
      }

      // Efficient Firestore query: limit to 1 and only fetch required fields
      const snapshot = await db
        .collection("QUESTIONS_PATH")
        .where("slug", "==", slug)
        .limit(1)
        .select("title", "description")
        .get();

      if (snapshot.empty) {
        res.status(404).json({error: "Question not found"});
        return;
      }

      const doc = snapshot.docs[0].data();
      res.status(200).json({
        title: doc.title || "ekScoop | Question",
        description:
          doc.description ||
          "Find out how YOU x 0.8 protein can be added to Indian foods"+
           "like dal, poha, or curd.",
      });
    } catch (err) {
      console.error("[getQuestionMeta] Error:", err);
      res.status(500).json({error: "Internal Server Error"});
    }
  });

const twilioSid = defineSecret("TWILIO_ACCOUNT_SID");
const twilioToken = defineSecret("TWILIO_AUTH_TOKEN");
const twilioPhone = defineSecret("TWILIO_PHONE_NUMBER");

export const sendOtp = onCall(
  {
    region: "us-central1",
    secrets: [twilioSid, twilioToken, twilioPhone],
  },
  async (request) => {
    const phone = request.data.phone;

    if (!phone || !/^\+\d{10,15}$/.test(phone)) {
      throw new HttpsError("invalid-argument", "Invalid phone number format");
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    await db.collection("otps").doc(phone).set({otp, expiresAt});

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID ?? "",
      process.env.TWILIO_AUTH_TOKEN ?? ""
    );

    await client.messages.create({
      body: `Your verification OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER ?? "",
      to: phone,
    });

    return {success: true, message: "OTP sent successfully"};
  }
);

export const verifyOtp = onCall(
  {
    region: "us-central1",
  },
  async (request) => {
    const {uid, phone, otp: userOtp} = request.data;

    if (!uid || typeof uid !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid UID.");
    }

    if (!phone || !/^\+\d{10,15}$/.test(phone)) {
      throw new HttpsError("invalid-argument", "Invalid phone number format.");
    }

    const otpDoc = await db.collection("otps").doc(phone).get();
    if (!otpDoc.exists) {
      throw new HttpsError(
        "not-found",
        "OTP not found or expired. Please request a new one."
      );
    }

    const data = otpDoc.data() as { otp: number; expiresAt: number };
    const {otp, expiresAt} = data;

    if (Date.now() > expiresAt) {
      await db.collection("otps").doc(phone).delete();
      throw new HttpsError(
        "deadline-exceeded",
        "OTP expired. Please request a new one."
      );
    }

    if (String(userOtp).trim() !== String(otp).trim()) {
      console.log(
        `OTP mismatch: entered=${String(userOtp).trim()} stored=${String(
          otp
        ).trim()}`
      );
      throw new HttpsError("permission-denied",
        "Incorrect OTP. Please try again.");
    }

    await db.collection("users").doc(uid).set(
      {
        phoneNumber: phone,
        verified: true,
      },
      {merge: true}
    );

    await db.collection("otps").doc(phone).delete();

    return {success: true, message: "Phone number verified successfully"};
  }
);
export const sitemap = onRequest(async (req, res) => {
  try {
    res.set("Content-Type", "application/xml");

    const questionsSnapshot = await db.collection("QUESTIONS_PATH").get();

    const urls = questionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      const slug = data.slug;
      const updatedAt = data.createdAt?.toDate()?.toISOString() ??
      new Date().toISOString();
      return `
  <url>
    <loc>https://ekscoop.com/questions/${slug}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join("\n")}
</urlset>`;

    res.status(200).send(sitemapXml);
  } catch (err) {
    console.error("Sitemap generation error:", err);
    res.status(500).send("Internal Server Error");
  }
}
);

/** 🔔 New: Ping Google when a question is created */
export const requestIndexingOnNewQuestion = onDocumentCreated(
  {
    region: "us-central1",
    document: "QUESTIONS_PATH/{questionId}",
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (event) => {
    const data = event.data?.data() as QuestionDoc | undefined;
    const slug = data?.slug;
    if (!slug) {
      console.log("No slug on new question; skipping indexing.");
      return;
    }
    await submitToIndexing(questionUrlFromSlug(slug), "URL_UPDATED");
  }
);

export const requestIndexingOnQuestionUpdate = onDocumentUpdated(
  {
    region: "us-central1",
    document: "QUESTIONS_PATH/{questionId}",
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (event) => {
    const before = event.data?.before.data() as QuestionDoc | undefined;
    const after = event.data?.after.data() as QuestionDoc | undefined;
    if (!before || !after) return;

    const changed =
      before.slug !== after.slug ||
      before.title !== after.title ||
      before.description !== after.description ||
      before.answersCount !== after.answersCount;

    if (!changed) return;

    const slug = after.slug ?? before.slug;
    if (!slug) {
      console.log("No slug available on update; skipping indexing.");
      return;
    }

    await submitToIndexing(questionUrlFromSlug(slug), "URL_UPDATED");
  }
);


const BUCKET_NAME = "ekscoop-website.appspot.com";
const FILE_PATH = "browse/all-questions.html";

let _storage: Storage | null = null;

/**
 * Lazily obtain the Cloud Storage bucket.
 * Avoids doing I/O at module load.
 * @return {object} Google Cloud Storage bucket instance
 */
function getBucket() {
  if (!_storage) _storage = new Storage();
  return _storage.bucket(BUCKET_NAME);
}


/**
 * Wrap the provided list HTML in a minimal full HTML document.
 * @param {string} body - HTML to insert inside the <ul> element.
 * @return {string} Full HTML page string.
 */
function wrapHtml(body: string): string {
  return `<!doctype html><html><head>
<meta charset="utf-8"><title>All Questions</title>
<meta name="robots" content="index,follow">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head><body><h1>All Questions</h1><ul>
${body}
</ul></body></html>`;
}

/**
 * Read a file from Cloud Storage; returns empty string if it does not exist.
 * @param {string} path - Path within the bucket.
 * @return {Promise<string>} UTF-8 contents or "" if missing.
 */
async function readFileOrEmpty(path: string): Promise<string> {
  const file = getBucket().file(path);
  const [exists] = await file.exists();
  if (!exists) return "";
  const [buf] = await file.download();
  return buf.toString("utf8");
}

/**
 * Write HTML content to Cloud Storage.
 * @param {string} path - Path within the bucket.
 * @param {string} html - HTML string to save.
 * @return {Promise<void>} Resolves when saved.
 */
async function writeHtml(path: string, html: string): Promise<void> {
  await getBucket().file(path).save(html, {
    contentType: "text/html; charset=UTF-8",
    metadata: {cacheControl: "public, max-age=60"},
    gzip: true,
    resumable: false,
    validation: false,
  });
}

/**
 * HTML-escape a title for safe insertion into markup.
 * @param {string} text - Unescaped text.
 * @return {string} Escaped text.
 */
function escapeHtml(text: string): string {
  return text.replace(/[<>&"]/g, (m) =>
    ({
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "\"": "&quot;",
    }[m] as string)
  );
}

/**
 * Append one <li><a>…</a></li> to an existing <ul>…</ul> HTML blob.
 * @param {string} html - Current HTML document string.
 * @param {string} slug - Question slug.
 * @param {string} title - Question title (will be escaped).
 * @return {string} Updated HTML.
 */
function appendLink(html: string, slug: string, title: string): string {
  const safeTitle = escapeHtml(title);
  const line = `<li><a href="/questions/${
    encodeURIComponent(slug)}">${safeTitle}</a></li>\n`;
  return html.replace("</ul>", `${line}</ul>`);
}

/**
 * Firestore onCreate trigger:
 * append new question link to /browse/all-questions.html.
 * @param {import("
 * firebase-functions/v2/firestore").FirestoreEvent<unknown>} event
 * @return {Promise<void>}
 */
export const appendAllQuestions = onDocumentCreated(
  {region: "us-central1", document: "QUESTIONS_PATH/{id}"},
  async (event) => {
    const data = event.data?.data() as {
      slug?: string; title?: string} | undefined;
    const slug = data?.slug;
    if (!slug) return;

    let html = await readFileOrEmpty(FILE_PATH);
    if (!html) html = wrapHtml("");

    const title = data?.title || slug;
    const updated = appendLink(html, slug, title);
    await writeHtml(FILE_PATH, updated);
  }
);
