import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";
import Razorpay from "razorpay";
import cors from "cors";


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
        const unitPrice = productData?.Discounted_Price;
        if (typeof unitPrice !== "number") {
          res.status(500).send({error: "Invalid product price in database"});
          return;
        }

        let amount = unitPrice * quantity;
        const baseAmount = amount; // keep original for % derivation
        let discountPercent = 0;
        let discountAmount = 0;

        // ✅ Validate promo if passed (flat discountAmount
        // takes priority over percentage)
        if (promoCode) {
          const promoSnap = await
          db.collection("promocodes").doc(promoCode).get();
          if (!promoSnap.exists) {
            res.status(400).send({error: "Promo code not found"});
            return;
          }

          const p = promoSnap.data() || {};

          // must be active
          if (p?.active !== true) {
            res.status(400).send({error: "Promo code inactive or invalid"});
            return;
          }

          // optional: validity window (ISO strings)
          const now = Date.now();
          const fromOk = !p.validFrom ||
          (new Date(p.validFrom).getTime() <= now);
          const toOk = !p.validTo || (new Date(p.validTo).getTime() >= now);
          if (!fromOk || !toOk) {
            res.status(400).send({error: "Promo code not valid at this time"});
            return;
          }

          // optional: minimum order amount
          if (typeof p.minOrderAmount === "number" &&
            baseAmount < p.minOrderAmount) {
            res.status(400).send({error: `Minimum order amount is ₹
              ${p.minOrderAmount} for this promo`});
            return;
          }

          // compute discount (prefer flat amount)
          if (typeof p.discountAmount === "number" && p.discountAmount > 0) {
            discountAmount = Math.min(p.discountAmount, amount);
            // derive % for response (for UI only)
            discountPercent = Math.round((discountAmount / baseAmount) * 100);
          } else if (typeof p.discountPercentage === "number" &&
            p.discountPercentage > 0) {
            let raw = Math.floor(baseAmount * (p.discountPercentage / 100));
            if (typeof p.maxDiscount === "number" && p.maxDiscount > 0) {
              raw = Math.min(raw, p.maxDiscount);
            }
            discountAmount = Math.min(raw, amount);
            discountPercent = p.discountPercentage;
          } else {
            res.status(400).send({error: "Promo code has no valid discount"});
            return;
          }

          amount = Math.max(0, amount - discountAmount);
        }

        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID ?? "",
          key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
        });

        const options = {
          amount: Math.round(amount * 100), // in paise, integer
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
