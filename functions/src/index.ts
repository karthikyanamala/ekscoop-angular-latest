// functions/src/index.ts
import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

if (!admin.apps.length) admin.initializeApp();

const REGION = "us-central1";
const UPDATE_AWB_KEY = defineSecret("UPDATE_AWB_KEY");

export const updateAwb = onRequest(
  {
    region: REGION,
    cors: true,
    secrets: [UPDATE_AWB_KEY], // attach the secret version to this deployment
  },
  async (req, res): Promise<void> => {
    // Allow browser preflight if ever called from web
    if (req.method === "OPTIONS") {
      res.status(204).send(""); return;
    }

    // --- Authorization (trim both sides; support array header) ---
    const raw = req.headers["x-api-key"];
    const supplied = (Array.isArray(raw) ? raw[0] : raw ?? "").
      toString().trim();
    const expected = UPDATE_AWB_KEY.value().toString().trim();

    // OPTIONAL: add ?debug=1 while testing to see masked values in logs
    if (req.query.debug === "1") {
      const mask = (s: string) =>
        s.length >= 6 ? `${s.slice(0, 3)}…${s.slice(-3)} (len=${s.length})` :
          `${s} (len=${s.length})`;
      logger.info("[auth-debug]", {gotHeader: mask(supplied),
        secret: mask(expected), equal: supplied === expected});
    }

    if (!supplied || supplied !== expected) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Use POST"); return;
    }
    if (!req.is("application/json")) {
      res.status(400).json({error: "Content-Type must be application/json"});
      return;
    }

    const {path, awb} = (req.body || {}) as { path?: string; awb?: string };
    if (!path || !awb) {
      res.status(400).json({error: "Missing required fields: path, awb"});
      return;
    }

    try {
      const ref = admin.firestore().doc(path);
      const snap = await ref.get();
      if (!snap.exists) {
        res.status(404).
          json({error: `Order not found at path: ${path}`}); return;
      }

      const trackingUrl = `https://www.delhivery.com/track-v2/package/${awb}`;
      await ref.set(
        {awb, courier: "Delhivery", trackingUrl, updatedAt: admin.firestore.
          FieldValue.serverTimestamp()},
        {merge: true}
      );

      res.json({ok: true, awb, trackingUrl});
    } catch (e: unknown) {
      if (e instanceof Error) {
        logger.error(e);
        res.status(500).json({error: e.message});
      } else {
        logger.error("Unknown error", e);
        res.status(500).json({error: "Internal error"});
      }
    }
  }
);
