import {onRequest, onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";
import Razorpay from "razorpay";
import cors from "cors";
import twilio from "twilio";

admin.initializeApp();
const db = admin.firestore();

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
