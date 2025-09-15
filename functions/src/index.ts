import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

// ---- Types ----
interface OrderAddress {
  fullName?: string;
  addressLine?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phoneNumber?: string;
}

interface Order {
  customer?: { name?: string };
  fullName?: string;
  finalAmount?: number;
  amount?: number;
  promoCodeUsed?: string;
  selectedAddress?: OrderAddress;
}

// ---- Secrets ----
const TWILIO_ACCOUNT_SID = defineSecret("TWILIO_ACCOUNT_SID"); // AC...
const TWILIO_AUTH_TOKEN = defineSecret("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = defineSecret("TWILIO_PHONE_NUMBER");

// Admin recipients (E.164)
const ADMIN_RECIPIENTS = ["+919666334055", "+918512041097"];

export const notifyAdminOnOrder = onDocumentCreated(
  {
    region: "us-central1",
    document: "orders/{orderId}",
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
    timeoutSeconds: 60,
  },
  async (event) => {
    const orderId = event.params.orderId;
    const snap = event.data;
    if (!snap) {
      console.error("notifyAdminOnOrder: empty snapshot");
      return null;
    }

    const order = snap.data() as Order;

    // Basic fields
    const customerName =
      (order.customer && order.customer.name) ||
      order.fullName ||
      (order.selectedAddress && order.selectedAddress.fullName) ||
      "N/A";

    const amount =
      typeof order.finalAmount === "number"? order.finalAmount :
        typeof order.amount === "number"? order.amount: "N/A";

    const promo = order.promoCodeUsed || "None";

    // Address
    const addr: OrderAddress = order.selectedAddress || {};
    const addressLines = [
      (addr.fullName || customerName || "").trim(),
      (addr.addressLine || "").trim(),
      (addr.locality || "").trim(),
      ((addr.city || "") + (addr.state ? ", " + addr.state : "") +
      (addr.pincode ? " " + addr.pincode : "")).trim(),
      (addr.phoneNumber ? "Phone: " + addr.phoneNumber : "").trim(),
    ].filter(Boolean) as string[];

    const addressText = addressLines.join("\n");

    // Build SMS body (double quotes only)
    const smsBody =
      "🛒 New Order Placed!\n" +
      "Order ID: " + orderId + "\n" +
      "Customer: " + customerName + "\n" +
      "Amount: ₹" + amount + "\n" +
      "Promo: " + promo + "\n\n" +
      "📦 Delivery Address:\n" + addressText;

    try {
      // Lazy import Twilio to avoid ESM-at-startup crash
      const {default: twilio} = await import("twilio");

      const accountSid = TWILIO_ACCOUNT_SID.value();
      const authToken = TWILIO_AUTH_TOKEN.value();
      const fromNumber = TWILIO_PHONE_NUMBER.value();

      if (!accountSid || accountSid.slice(0, 2) !== "AC" ||
      !authToken || !fromNumber) {
        console.error(`"notifyAdminOnOrder:Twilio secrets
          not configured correctly"`);
        return null;
      }

      const client = twilio(accountSid, authToken);

      await Promise.all(
        ADMIN_RECIPIENTS.map((to) =>
          client.messages.create({body: smsBody, from: fromNumber, to})
        )
      );

      console.log("notifyAdminOnOrder: SMS sent for order " + orderId);
    } catch (err) {
      console.error("notifyAdminOnOrder: failed to send SMS", err);
    }

    return null;
  }
);
