import * as admin from "firebase-admin";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";

admin.initializeApp();

const REGION = "asia-south1";
const SUCCESS = new Set(["Paid", "Delivered", "Completed"]);

/** Firestore shape for review eligibility. */
interface EligDoc {
  remaining: number;
  orders: Record<string, boolean>;
  updatedAt?:
    | FirebaseFirestore.FieldValue
    | FirebaseFirestore.Timestamp;
}

/** Minimal order shape used by the triggers. */
interface OrderDoc {
  status?: string;
  paymentStatus?: string;
  userId?: string;
  uid?: string;
  customer?: { uid?: string; email?: string };
}

/** Payload for the callable submitReview. */
interface SubmitReviewRequest {
  orderId: string;
  name: string;
  rating: number;
  text: string;
}

/**
 * Normalize a raw order status into a canonical value.
 * Accepts provider-specific values like "paid", "captured",
 * "delivered", "completed", etc., and returns title-case forms.
 *
 * @param {unknown} raw - Raw status from the order (status/paymentStatus).
 * @return {string} Canonical status: "Paid" | "Delivered" | "Completed" | "".
 */
function normalizeStatus(raw: unknown): string {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "";
  if (s === "paid" || s === "success" ||
    s === "succeeded" || s === "captured") {
    return "Paid";
  }
  if (s === "delivered") return "Delivered";
  if (s === "completed" || s === "complete") return "Completed";
  return "";
}

/**
 * Resolve the Firebase Auth UID for an order.
 * Tries `userId`, `uid`, `customer.uid`, then falls back to
 * `customer.email` via Admin Auth lookup.
 *
 * @param {OrderDoc} order - The order document to inspect.
 * @return {Promise<string>} The resolved UID, or empty string if unknown.
 */
async function resolveUid(order: OrderDoc): Promise<string> {
  let uid = order.userId ?? order.uid ?? order?.customer?.uid ?? "";
  if (!uid && order?.customer?.email) {
    try {
      const rec = await admin.auth().getUserByEmail(order.customer.email);
      uid = rec.uid;
    } catch {
      // ignore if not found
    }
  }
  return uid || "";
}

/**
 * Grant one review slot for a successful order.
 * Updates review_eligibility/{uid} in a transaction.
 *
 * @param {string} uid - Owner of the order.
 * @param {string} orderId - The successful order id.
 * @param {"Paid"|"Delivered"|"Completed"|string} status - Order status.
 * @return {Promise<void>}
 */
async function grantForOrder(
  uid: string,
  orderId: string,
  status: string
): Promise<void> {
  if (!uid || !orderId || !SUCCESS.has(String(status))) {
    return;
  }

  const ref = admin.firestore().doc(`review_eligibility/${uid}`);

  await admin.firestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data: EligDoc = snap.exists ? (snap.data() as EligDoc) :
      {remaining: 0, orders: {}};

    // Already granted or already consumed → ignore.
    const was = data.orders?.[orderId];
    if (was === true || was === false) return;

    const nextOrders = {...(data.orders || {}), [orderId]: true};
    const nextRemaining = (data.remaining || 0) + 1;

    tx.set(
      ref,
      {
        remaining: nextRemaining,
        orders: nextOrders,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {merge: true}
    );
  });
}

/**
 * Firestore trigger: /orders/{orderId}
 * Grants eligibility when a global order transitions to success.
 * Accepts either "status" or "paymentStatus".
 */
export const grantEligibilityFromGlobalOrders = onDocumentWritten(
  {document: "orders/{orderId}", region: REGION},
  async (event) => {
    const before = event.data?.before?.data() as OrderDoc | undefined;
    const after = event.data?.after?.data() as OrderDoc | undefined;
    if (!after) return;

    const beforeStatus =
      normalizeStatus(before?.status ?? before?.paymentStatus);
    const afterStatus =
      normalizeStatus(after?.status ?? after?.paymentStatus);

    // Only act on a transition to a successful state
    if (!afterStatus || SUCCESS.has(beforeStatus)) return;

    const uid = await resolveUid(after);
    if (!uid) return;

    const orderId = event.params["orderId"];
    await grantForOrder(uid, orderId, afterStatus);
  }
);

/**
 * Firestore trigger: /users/{uid}/orders/{orderId}
 * Grants eligibility when a per-user order transitions to success.
 * Accepts either "status" or "paymentStatus".
 */
export const grantEligibilityFromUserOrders = onDocumentWritten(
  {document: "users/{uid}/orders/{orderId}", region: REGION},
  async (event) => {
    const before = event.data?.before?.data() as OrderDoc | undefined;
    const after = event.data?.after?.data() as OrderDoc | undefined;
    if (!after) return;

    const beforeStatus =
      normalizeStatus(before?.status ?? before?.paymentStatus);
    const afterStatus =
      normalizeStatus(after?.status ?? after?.paymentStatus);

    if (!afterStatus || SUCCESS.has(beforeStatus)) return;

    const uid = event.params["uid"];
    const orderId = event.params["orderId"];
    await grantForOrder(uid, orderId, afterStatus);
  }
);

/**
 * Callable: submit a review for a specific order.
 * - Validates a free slot (orders[orderId] === true)
 * - Writes reviews/{uid}_{orderId}
 * - Consumes the slot (orders[orderId] = false, remaining--)
 *
 * @param {{ auth?: { uid: string }, data: SubmitReviewRequest }} req
 * @returns {Promise<{ ok: true }>}
 */
export const submitReview = onCall({region: REGION}, async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const data = req.data as SubmitReviewRequest;
  const {orderId, name, rating, text} =
    data || ({} as SubmitReviewRequest);

  if (!orderId || !name || typeof rating !== "number" || !text) {
    throw new HttpsError(
      "invalid-argument",
      "orderId, name, rating, text are required."
    );
  }
  if (rating < 1 || rating > 5) {
    throw new HttpsError(
      "invalid-argument",
      "rating must be an integer 1..5."
    );
  }

  const uid = req.auth.uid;
  const eligRef = admin.firestore().doc(`review_eligibility/${uid}`);
  const reviewId = `${uid}_${orderId}`;
  const reviewRef = admin.firestore().doc(`reviews/${reviewId}`);

  await admin.firestore().runTransaction(async (tx) => {
    const eligSnap = await tx.get(eligRef);
    const elig = eligSnap.exists ? (eligSnap.data() as EligDoc) : null;

    const allowed = Boolean(elig?.orders?.[orderId] === true);
    if (!allowed) {
      throw new HttpsError(
        "failed-precondition",
        "Not eligible to review this order."
      );
    }

    const already = await tx.get(reviewRef);
    if (already.exists) {
      throw new HttpsError(
        "already-exists",
        "Review already submitted for this order."
      );
    }

    tx.set(reviewRef, {
      uid,
      orderId,
      name,
      rating,
      text,
      status: "approved", // or "pending" for moderation
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const currentRemaining =
      typeof elig?.remaining === "number" ? elig.remaining : 1;
    const currentOrders = elig?.orders ?? {};
    const nextRemaining = Math.max(0, currentRemaining - 1);
    const nextOrders = {...currentOrders, [orderId]: false};

    tx.set(
      eligRef,
      {
        remaining: nextRemaining,
        orders: nextOrders,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {merge: true}
    );
  });

  return {ok: true};
});
