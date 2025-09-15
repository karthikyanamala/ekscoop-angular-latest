import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const twilioSid = defineSecret("TWILIO_ACCOUNT_SID");
const twilioToken = defineSecret("TWILIO_AUTH_TOKEN");
const twilioPhone = defineSecret("TWILIO_PHONE_NUMBER");

export const sendOtp = onCall(
  {
    region: "us-central1",
    secrets: [twilioSid, twilioToken, twilioPhone],
    timeoutSeconds: 60,
  },
  async (request) => {
    const phone = String(request.data?.phone || "").trim();
    if (!/^\+\d{10,15}$/.test(phone)) {
      throw new HttpsError("invalid-argument", "Invalid phone number format");
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 5 * 60 * 1000;

    await db.collection("otps").doc(phone).set({otp, expiresAt});

    // ✅ Lazy-import Twilio to avoid ESM-at-top-level crashes
    const {default: twilio} = await import("twilio");
    const sid = twilioSid.value();
    const token = twilioToken.value();
    const from = twilioPhone.value();
    if (!sid || !token || !from) {
      throw new HttpsError("failed-precondition",
        "Twilio secrets not configured");
    }

    const client = twilio(sid, token);
    await client.messages.create({
      body: `🔐 Verification OTP for ekScoop: ${otp}\nDo not
share this code with anyone.`,
      from: from,
      to: phone,
    });

    return {success: true, message: "OTP sent successfully"};
  }
);
