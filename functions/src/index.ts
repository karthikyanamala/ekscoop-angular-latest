// functions/src/delhivery.ts
import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

/** Region must match your deployed region (e.g., us-central1) */
const REGION = "us-central1";

/** Secret: set with `firebase functions:secrets:set DELHIVERY_TOKEN` */
const DELHIVERY_TOKEN = defineSecret("DELHIVERY_TOKEN");

/** Choose Delhivery base according to your env */
const DELHIVERY_BASE =
  process.env.DELHIVERY_ENV === "staging"? "https://staging-express.delhivery.com": "https://track.delhivery.com";

/** A minimal shape for a single pincode entry returned by Delhivery */
type DeliveryCodesEntry = {
  postal_code?: {
    district?: string;
    city?: string;
    state?: string;
    pin?: string | number;
  };
  city?: string;
  state?: string;
  pin?: string | number;

  // prepaid flags (vendors/accounts vary)
  pre_paid?: "Y" | "N" | boolean;
  prepaid?: "Y" | "N" | boolean;
  is_prepaid_serviceable?: boolean;

  [k: string]: unknown;
};

type PincodeResult =
  | { ok: true; pin: string; city: string; state: string; serviceable: boolean }
  | { ok: false; error: string };

/**
 * Type guard to check if a value is
 *  a non-null object (Record<string, unknown>).
 * @param {unknown} x Any value to check.
 * @return {boolean} True if `x` is an object.
 */
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}


/**
 * Safely coerce an unknown value into
 *  a DeliveryCodesEntry when it is object-like.
 * @param {unknown} x - Any value.
 * @return {DeliveryCodesEntry|null} The entry or null when coercion is unsafe.
 */
function toEntry(x: unknown): DeliveryCodesEntry | null {
  return isRecord(x) ? (x as DeliveryCodesEntry) : null;
}

/**
 * Extracts the first useful entry from possible Delhivery response shapes:
 * (1) { delivery_codes: [...] }, (2) [...], or (3) single object.
 * @param {unknown} data - Parsed JSON from Delhivery API.
 * @return {DeliveryCodesEntry|null} The first entry or null if none.
 */
function extractFirstEntry(data: unknown): DeliveryCodesEntry | null {
  // Case 1: { delivery_codes: [...] }
  if (isRecord(data) && "delivery_codes" in data) {
    const dc = (data as { delivery_codes?: unknown }).delivery_codes;
    if (Array.isArray(dc) && dc.length > 0) {
      const first = toEntry(dc[0]);
      if (first) return first;
    }
  }
  // Case 2: top-level array
  if (Array.isArray(data) && data.length > 0) {
    const first = toEntry(data[0]);
    if (first) return first;
  }
  // Case 3: single object
  const single = toEntry(data);
  return single ?? null;
}

/**
 * Convert unknown to string safely (numbers allowed).
 * @param {unknown} v - A possibly string/number value.
 * @return {string} Stringified value or empty string.
 */
function asText(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

/**
 * Compute prepaid serviceability from various flags Delhivery may send.
 * @param {DeliveryCodesEntry} entry - A normalized entry.
 * @return {boolean} True if prepaid is serviceable.
 */
function isPrepaidServiceable(entry: DeliveryCodesEntry): boolean {
  const yes = (val: unknown) =>
    val === true || String(val).toUpperCase() === "Y";
  return (
    yes(entry.pre_paid) ||
    yes(entry.prepaid) ||
    entry.is_prepaid_serviceable === true
  );
}

export const pincodeLookup = onRequest(
  {
    region: REGION,
    cors: true,
    secrets: [DELHIVERY_TOKEN],
    timeoutSeconds: 10,
  },
  async (req, res) => {
    try {
      // 1) Input validation
      const pin = String(req.query.pin ?? "").trim();
      if (!/^\d{6}$/.test(pin)) {
        const out: PincodeResult = {ok: false, error: "pin must be 6 digits"};
        res.status(400).json(out);
        return;
      }

      // 2) Secret (v2 style)
      const token = DELHIVERY_TOKEN.value();
      if (!token) {
        logger.error("DELHIVERY_TOKEN missing at runtime");
        const out: PincodeResult = {ok: false, error: "token missing"};
        res.status(500).json(out);
        return;
      }

      // 3) Upstream call
      const url =
        `${DELHIVERY_BASE}/c/api/pin-codes/json/` +
        `?token=${encodeURIComponent(token)}
        &filter_codes=${encodeURIComponent(pin)}`;
      const safeUrl = url.replace(/\s/g, "");
      // FIX 1: strip whitespace/newlines from template literal

      const r = await fetch(safeUrl, {headers: {Accept: "application/json"}});
      if (!r.ok) {
        logger.error("Delhivery upstream error", {status: r.status, pin});
        const out: PincodeResult = {ok: false, error: "upstream error"};
        res.status(502).json(out);
        return;
      }

      // 4) Parse + normalize without `any`
      const data: unknown = await r.json();
      const rec = extractFirstEntry(data);

      const city =
        asText(rec?.postal_code?.district) ||
        asText(rec?.postal_code?.city) ||
        asText(rec?.city);

      const state =
         asText(rec?.postal_code?.state) ||
         asText(rec?.state) ||
         asText((rec as Record<string, unknown>)["state_code"]) ||
         asText((rec as Record<string, unknown>)["circle"]) ||
         "";

      const pinCode =
        asText(rec?.postal_code?.pin) ||
        asText(rec?.pin) ||
        pin;

      // FIX 2: also check flags nested under
      //  postal_code (many accounts put them there)
      const pc = (rec && (
        rec as
        Record<string, unknown>)["postal_code"]) as Record<string, unknown>
        | undefined;
      const yes = (v: unknown) => v === true ||
      (typeof v === "string" && v.toUpperCase() === "Y");
      const serviceable =
        !!(rec && (
          isPrepaidServiceable(rec) ||
          (pc && (yes(pc["pre_paid"] || yes(pc["prepaid"])||
          pc["is_prepaid_serviceable"] === true))
          )
        ));

      const out: PincodeResult = {
        ok: true,
        pin: pinCode,
        city: city.toUpperCase(),
        state: state.toUpperCase(),
        serviceable,
      };

      // 5) Cache headers are safe for pin lookups
      res.set("Cache-Control", "private, max-age=300"); // 5 minutes
      res.json(out);
    } catch (e: unknown) {
      if (e instanceof Error) {
        logger.error(e);
        const out: PincodeResult = {ok: false, error: e.message};
        res.status(500).json(out);
      } else {
        logger.error("Unknown error", e);
        const out: PincodeResult = {ok: false, error: "lookup failed"};
        res.status(500).json(out);
      }
    }
  }
);
