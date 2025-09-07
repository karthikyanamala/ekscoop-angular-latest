import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import type {Timestamp} from "firebase-admin/firestore";

/* -------------------- Secrets -------------------- */

/**
 * Secret for Postmark Server API token.
 * Set via: firebase functions:secrets:set POSTMARK_API_TOKEN
 */
const POSTMARK_API_TOKEN = defineSecret("POSTMARK_API_TOKEN");

/**
 * Branded "from" address for order emails.
 */
const FROM_EMAIL = "contact@ekscoop.com";

/* -------------------- Email client (lazy) -------------------- */

/**
 * Postmark module type (module object, not instance).
 */
type PostmarkModule = typeof import("postmark");

/** Cached Postmark module. */
let pmModule: PostmarkModule | null = null;

/** Cached Postmark ServerClient instance. */
let pmClient: import("postmark").ServerClient | null = null;

/**
 * @typedef {object} SendEmailOptions
 * @property {string} to - Recipient email address.
 * @property {string} subject - Subject line for the email.
 * @property {string} html - HTML payload for the email.
 * @property {string} [text] - Optional plain text payload.
 */
type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Sends an email using Postmark.
 *
 * @param {SendEmailOptions} opts - The mail options.
 * @return {Promise<void>} Resolves when the email has been sent.
 */
async function sendEmail(opts: SendEmailOptions): Promise<void> {
  if (!pmClient) {
    pmModule = await import("postmark");
    pmClient = new pmModule.ServerClient(POSTMARK_API_TOKEN.value());
  }

  await pmClient.sendEmail({
    From: FROM_EMAIL,
    // To: opts.to,
    To: FROM_EMAIL,
    Subject: opts.subject,
    HtmlBody: opts.html,
    TextBody: opts.text ?? "Thank you for your order with ekScoop.",
    MessageStream: "outbound",
  });
}

/* -------------------- Types & helpers -------------------- */

/**
 * Common currency formatter for INR (no paise shown).
 */
const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Accepted shapes for paidAt (avoids any). */
type PaidAt = Timestamp | Date | string | number | null | undefined;

/**
 * Firestore order document shape.
 */
type OrderData = {
  uid: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  paymentStatus: "paid" | "failed" | "pending";
  paidAt: PaidAt;
  amount: number;
  finalAmount: number;
  promoCodeUsed?: string | null;
  promoDiscountPercent?: number;
  promoDiscountAmount?: number;
  currency: "INR" | string;
  selectedAddress: {
    fullName?: string;
    phoneNumber?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  customer: { name: string; email: string; phone: string };
  products: Array<{
    name: string;
    image?: string;
    quantity: number;
    unitPrice: number;
  }>;
};

/**
 * Builds a single-line postal address.
 *
 * @param {*} a - Selected address object from order.
 * @return {string} A formatted address string.
 */
function fmtAddress(
  a: OrderData["selectedAddress"]
): string {
  if (!a) return "";
  const parts = [
    a.line1,
    a.line2,
    a.city,
    a.state,
    a.pincode,
  ].filter(Boolean);
  return parts.join(", ");
}

/**
 * Returns a safe, localized date string for "paidAt".
 *
 * @param {PaidAt} paidAt - Timestamp or Date-like value.
 * @return {string} Local date string in IST or empty string.
 */
function safePaidDate(paidAt: PaidAt): string {
  try {
    const d =
      (paidAt as Timestamp)?.toDate?
        (paidAt as Timestamp).toDate():
        new Date(paidAt as string | number | Date);
    return d.toLocaleString("en-IN", {timeZone: "Asia/Kolkata"});
  } catch {
    return "";
  }
}

/**
 * Builds the HTML rows for the product line items.
 *
 * @param {OrderData} data - Order data with products array.
 * @return {string} HTML string for table rows.
 */
function buildItemsRows(data: OrderData): string {
  return data.products
    .map((p) => {
      return [
        "<tr>",
        "<td style=\"padding:12px 16px; " +
          "border-bottom:1px solid #eee;\">",
        "<div style=\"font-weight:600;\">",
        p.name,
        "</div>",
        "<div style=\"font-size:12px; color:#6b7280;\">",
        "Qty: ",
        String(p.quantity),
        "</div>",
        "</td>",
        "<td style=\"padding:12px 16px; text-align:right; " +
          "border-bottom:1px solid #eee;\">",
        INR.format(p.unitPrice),
        " <span style=\"color:#6b7280;\">× ",
        String(p.quantity),
        "</span>",
        "</td>",
        "</tr>",
      ].join("");
    })
    .join("");
}

/**
 * Builds the full HTML email body for an order.
 *
 * @param {string} orderId - Firestore order doc id.
 * @param {OrderData} data - Order data payload.
 * @return {string} Complete HTML string for email.
 */
function buildEmailHtml(
  orderId: string,
  data: OrderData
): string {
  const logo =
    "https://ekscoop.com/assets/favicon/android-chrome-192x192.png";

  const subtotal = data.products
    .reduce((s, p) => s + p.unitPrice * p.quantity, 0);

  const discount = Math.round(data.promoDiscountAmount ?? 0);
  const grand = Math.round(data.finalAmount ?? subtotal);
  const paidDate = safePaidDate(data.paidAt);
  const itemsRows = buildItemsRows(data);

  const orderUrl =
    "https://ekscoop.com/orders/" + encodeURIComponent(orderId);

  const head = [
    "<div style=\"background:#f6f7fb; padding:24px; " +
      "font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto," +
      "Helvetica,Arial,sans-serif; color:#111827;\">",
    "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" " +
      "cellpadding=\"0\" style=\"max-width:720px; margin:0 auto; " +
      "background:#ffffff; border-radius:16px; overflow:hidden; " +
      "box-shadow:0 10px 24px rgba(0,0,0,0.06);\">",
    "<tr>",
    "<td style=\"padding:24px 28px; " +
      "background:linear-gradient(135deg,#ff9f43,#ff5e00); color:#fff;\">",
    "<table width=\"100%\">",
    "<tr>",
    "<td style=\"vertical-align:middle;\">",
    "<img src=\"" + logo + "\" alt=\"ekScoop\" width=\"40\" height=\"40\" " +
      "style=\"border-radius:12px; display:block;\"/>",
    "</td>",
    "<td style=\"vertical-align:middle; padding-left:12px;\">",
    "<div style=\"font-size:18px; font-weight:700;\">",
    "Order Confirmation",
    "</div>",
    "<div style=\"opacity:.9; font-size:13px;\">",
    "Thanks for your order, ",
    data.customer.name,
    "!",
    "</div>",
    "</td>",
    "<td style=\"text-align:right; vertical-align:middle;\">",
    "<div style=\"font-size:12px; background:#ffffff22; " +
      "padding:6px 10px; border-radius:999px;\">",
    "Paid • ",
    paidDate,
    "</div>",
    "</td>",
    "</tr>",
    "</table>",
    "</td>",
    "</tr>",
  ].join("");

  const bodyTop = [
    "<tr>",
    "<td style=\"padding:22px 28px;\">",
    "<div style=\"font-size:14px; color:#374151; margin-bottom:12px;\">",
    "We’ve received your payment. Your order will be prepared " +
      "and shipped soon.",
    "</div>",
    "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" " +
      "cellpadding=\"0\" style=\"border:1px solid #eee; " +
      "border-radius:12px; overflow:hidden;\">",
    "<tr>",
    "<td style=\"padding:16px; background:#fafafa; font-weight:600;\">",
    "Order Details",
    "</td>",
    "<td style=\"padding:16px; background:#fafafa; text-align:right;\">",
    "<span style=\"font-weight:600; color:#16a34a;\">",
    INR.format(grand),
    "</span>",
    "</td>",
    "</tr>",
    "<tr>",
    "<td colspan=\"2\" style=\"padding:0;\">",
    "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" " +
      "cellpadding=\"0\">",
    itemsRows,
    "</table>",
    "</td>",
    "</tr>",
    "<tr>",
    "<td style=\"padding:12px 16px; text-align:right; color:#6b7280;\">",
    "Subtotal",
    "</td>",
    "<td style=\"padding:12px 16px; text-align:right;\">",
    INR.format(subtotal),
    "</td>",
    "</tr>",
  ].join("");

  const discountRow =
    discount > 0 ? [
      "<tr>",
      "<td style=\"padding:4px 16px; text-align:right; " +
            "color:#16a34a;\">",
      "Discount ",
      data.promoCodeUsed ? "(" +
            data.promoCodeUsed.toUpperCase() + ")" : "",
      data.promoDiscountPercent ? " • " +
            String(data.promoDiscountPercent) + "%" : "",
      "</td>",
      "<td style=\"padding:4px 16px; text-align:right; " +
            "color:#16a34a;\">",
      "− ",
      INR.format(discount),
      "</td>",
      "</tr>",
    ].join(""): "";

  const bodyTotals = [
    discountRow,
    "<tr>",
    "<td style=\"padding:14px 16px; text-align:right; font-weight:700;\">",
    "Total Paid",
    "</td>",
    "<td style=\"padding:14px 16px; text-align:right; font-weight:700;\">",
    INR.format(grand),
    "</td>",
    "</tr>",
    "</table>",
  ].join("");

  const shippingAndPay = [
    "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" " +
      "cellpadding=\"0\" style=\"margin-top:18px;\">",
    "<tr>",
    "<td style=\"vertical-align:top; width:50%;\">",
    "<div style=\"font-weight:600; margin-bottom:6px;\">",
    "Shipping To",
    "</div>",
    "<div style=\"font-size:14px; color:#374151;\">",
    (data.selectedAddress?.fullName ?? data.customer.name),
    "<br/>",
    fmtAddress(data.selectedAddress),
    "<br/>",
    "Phone: ",
    (data.selectedAddress?.phoneNumber ?? data.customer.phone),
    "</div>",
    "</td>",
    "<td style=\"vertical-align:top; width:50%;\">",
    "<div style=\"font-weight:600; margin-bottom:6px;\">",
    "Payment",
    "</div>",
    "<div style=\"font-size:14px; color:#374151;\">",
    "Status: <b>",
    data.paymentStatus,
    "</b><br/>",
    "Razorpay Order: <code>",
    data.razorpayOrderId,
    "</code><br/>",
    "Payment ID: <code>",
    data.razorpayPaymentId,
    "</code><br/>",
    "Currency: ",
    data.currency,
    "</div>",
    "</td>",
    "</tr>",
    "</table>",
  ].join("");

  const tail = [
    "<div style=\"margin-top:22px; background:#fff7ed; " +
      "border:1px solid #ffedd5; padding:14px 16px; border-radius:12px; " +
      "color:#7c2d12; font-size:13px;\">",
    "Tip: Mix ekScoop protein with roti, dal, poha, or curd—unflavoured, " +
      "vegan, diabetic-friendly.",
    "</div>",
    "<div style=\"text-align:center; margin-top:22px;\">",
    "<a href=\"" + orderUrl + "\" " +
      "style=\"display:inline-block; background:#ff5e00; color:#fff; " +
      "text-decoration:none; padding:12px 18px; border-radius:12px; " +
      "font-weight:700;\">",
    "View Order Status",
    "</a>",
    "</div>",
    "<div style=\"margin-top:24px; font-size:12px; color:#6b7280; " +
      "text-align:center;\">",
    "Need help? Reply to this email or WhatsApp us at +91 8512041097.",
    "</div>",
    "</td>",
    "</tr>",
    "<tr><td style=\"height:12px;\"></td></tr>",
    "</table>",
    "<div style=\"max-width:720px; margin:10px auto 0; " +
      "text-align:center; font-size:11px; color:#6b7280;\">",
    "© " + new Date().getFullYear() +
      " ekScoop • Unflavoured Plant Protein • Bengaluru, India",
    "</div>",
    "</div>",
  ].join("");

  return head + bodyTop + bodyTotals + shippingAndPay + tail;
}

/* -------------------- Firestore trigger -------------------- */

/**
 * Sends order confirmation email when a new order doc is created.
 */
export const emailOnOrderCreate = onDocumentCreated(
  {
    region: "asia-south1",
    document: "orders/{orderId}",
    secrets: [POSTMARK_API_TOKEN],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const orderId = event.params.orderId;
    const data = snap.data() as OrderData;

    const to = data?.customer?.email;
    if (!to) {
      logger.warn(
        "Order missing customer.email; skipping email",
        {orderId}
      );
      return;
    }

    const subject = "ekScoop Order Confirmed — " + orderId;

    const itemsList = (data.products ?? [])
      .map((p) => p.name + " x " + String(p.quantity))
      .join(", ");

    const html = buildEmailHtml(orderId, data);

    await sendEmail({
      to,
      subject,
      html,
      text:
        "Thanks for your order of " +
        itemsList +
        ". Total: " +
        INR.format(data.finalAmount),
    });

    logger.info(
      "Order confirmation email sent",
      {orderId, to}
    );
  }
);

/* -------------------- Optional: callable resend -------------------- */

/**
 * Resends the confirmation email for a given order.
 *
 * @param {import("firebase-functions/v2/https").CallableRequest} req
 *  Callable request with fields:
 *  - orderId: string (required)
 *  - to: string (optional override recipient)
 * @returns {{ok: true}} Object with ok=true on success.
 */
export const resendOrderEmail = onCall(
  {
    region: "asia-south1",
    secrets: [POSTMARK_API_TOKEN],
  },
  async (req) => {
    const orderId = req.data?.orderId as string | undefined;
    const forceTo = req.data?.to as string | undefined;

    if (!orderId) {
      throw new HttpsError("invalid-argument", "orderId required");
    }

    const {getFirestore} = await import("firebase-admin/firestore");
    const db = getFirestore();

    const snap = await db.doc("orders/" + orderId).get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Order not found");
    }

    const data = snap.data() as OrderData;
    const to = forceTo || data?.customer?.email;

    if (!to) {
      throw new HttpsError(
        "failed-precondition",
        "No email on order and no 'to' provided"
      );
    }

    const subject = "ekScoop Order Confirmed — " + orderId;
    const html = buildEmailHtml(orderId, data);

    await sendEmail({to, subject, html});

    return {ok: true};
  }
);
