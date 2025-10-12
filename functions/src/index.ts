import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {Request, Response} from "express";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/** Extend Express Request with our optional admin fields */
/**
 * Clamp a number between minimum and maximum values (inclusive).
 *
 * @param {number} n - The input number to clamp.
 * @param {number} min - The minimum allowed value.
 * @param {number} max - The maximum allowed value.
 * @return {number} The clamped value between min and max.
 */
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

/**
 * Convert an unknown input into a finite number.
 * Returns 0 if the value is not a valid number.
 *
 * @param {unknown} v - The value to convert.
 * @return {number} The numeric value, or 0 if NaN or infinite.
 */
function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Round a number to two decimal places.
 *
 * @param {number} n - The number to round.
 * @return {number} The rounded number with two decimals.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
/**
 * Escape special HTML characters (&, <, >, ", ') for safe output.
 * @param {string} [s=""] - The string to escape.
 * @return {string}The escaped, HTML-safe string.
 */
function escapeHtml(s = ""): string {
  const map: Readonly<Record<string, string>> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  };
  return String(s).replace(/[&<>"']/g, (ch: string): string => map[ch] ?? ch);
}

/**
 * Normalize any date-like string to YYYY-MM-DD (digits and dashes only).
 * @param {string} [s] - Input string that may contain extra
 * characters or spaces.
 * @return {string}Normalized date key in the format YYYY-MM-DD.
 */
function normalizeDayKey(s: string): string {
  return s.replace(/[^0-9-]/g, "").slice(0, 10);
}


type PromoDoc = {
  viewerSecret?: string;// per-promo viewer secret (salesperson)
  // backwards-compat
  secret?: string;
  ownerId?: string | null;
  isActive?: boolean;
};

type OrderDoc = {
  paidAt?: admin.firestore.Timestamp;

  // display helpers
  name?: string;
  productTitle?: string;

  // pricing (not used for payout math)
  totalAmount?: number;
  lineTotal?: number;
  amount?: number;
  promoDiscountAmount?: number;

  // quantity hints
  quantityKg?: number;
  quantity?: number;// if only count exists, assume 0.5 kg per unit
  unitPrice?: number;

  // array of products
  products?: Array<{
    name?: string;
    quantityKg?: number;
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
  }>;
};

type DailyRow = { date: string; orders: number; payout: number };
type RecentRow = {
  id: string; when: string; item: string; qtyKg: number; payout: number };

/**
 * Render the HTML for the promo dashboard.
 *
 * @param {object} p - Page rendering parameters.
 * @param {string} p.promoCode - Promo code.
 * @param {string} p.ownerId - Owner or salesperson label.
 * @param {number} p.days - Reporting window in days.
 * @param {number} p.totalOrders - Total orders count.
 * @param {number} p.totalPayout - Total payout in window.
 * @param {number} p.paidOrders - Orders already marked as paid.
 * @param {number} p.pendingOrders - Orders pending payment.
 * @param {number} p.totalPaidAmount - Sum of paid ₹ across days.
 * @param {number} p.totalPendingAmount - Remaining ₹ to pay.
 * @param {DailyRow[]} p.daily - Daily aggregates (decorated with paid fields).
 * @param {RecentRow[]} p.recent - Recent orders list.
 * @param {boolean} p.isAdmin - Is viewer admin.
 * @param {string} p.viewerKey - Viewer secret (only for salesperson mode).
 * @return {string} HTML document.
 */
function renderHtml(p: {
  promoCode: string;
  ownerId: string;
  days: number;
  totalOrders: number;
  totalPayout: number;
  paidOrders: number;
  pendingOrders: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
  daily: DailyRow[];
  recent: RecentRow[];
  isAdmin: boolean;
  viewerKey: string;
}): string {
  const {
    promoCode, ownerId, days, totalOrders, totalPayout,
    paidOrders, pendingOrders, totalPaidAmount, totalPendingAmount, daily,
    recent, isAdmin, viewerKey,
  } = p;

  return `<!doctype html>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(promoCode)} – Promo Dashboard</title>
<style>
  body{font-family:system-ui,Arial;margin:24px}
  .card{border:1px solid #eee;border-radius:12px;padding:16px;
  margin:0 0 12px;box-shadow:0 2px 8px rgba(0,0,0,.05)}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:12px}
  .big{font-size:28px;font-weight:800}
  table{width:100%;border-collapse:collapse}th,
  td{padding:8px;border-bottom:1px solid #f2f2f2;text-align:left}
  .muted{color:#666}
  .controls a{display:inline-block;margin-right:8px;
  padding:6px 10px;border:1px solid #ddd;border-radius:8px;text-decoration:none}
  .pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px}
  .pill-admin{background:#eef3ff;border:1px solid #cfdcff}
  .btn-row a{display:inline-block;margin-right:6px;padding:4px 8px;
  border:1px solid #ddd;border-radius:8px;text-decoration:none}
</style>

<div class="card">
  <h2>Promo: ${escapeHtml(promoCode)}</h2>
  <div>Owner: ${escapeHtml(ownerId)}</div>
  <div>Window: last ${days} days</div>
  ${isAdmin ? "<div class=\"pill pill-admin\">Admin</div>" : ""}
</div>

<div class="grid">
  <div class="card"><h3>Orders</h3><div class="big">${totalOrders}</div></div>
  <div class="card"><h3>Payout (all)</h3><div class="big">
  ₹ ${round2(totalPayout)}</div></div>
  <div class="card"><h3>Paid Orders</h3>
  <div class="big">${paidOrders}</div></div>
  <div class="card"><h3>Pending Orders</h3>
  <div class="big">${pendingOrders}</div></div>
  <div class="card"><h3>Paid ₹</h3>
  <div class="big">₹ ${round2(totalPaidAmount)}</div></div>
  <div class="card"><h3>Pending ₹</h3>
  <div class="big">₹ ${round2(totalPendingAmount)}</div></div>
</div>

<div class="card">
  <h3>Daily (latest first)</h3>
  <table>
    <thead><tr><th>Date</th><th>Orders</th><th>Paid</th>
    <th>Pending</th><th>Payout</th><th>Paid ₹</th><th>Pending ₹
    </th>${isAdmin ? "<th>Pay</th>" : ""}</tr></thead>
    <tbody>
      ${daily.map((d: Record<string, number | string>) => `
        <tr>
          <td>${d.date}</td>
          <td>${d.orders}</td>
          <td>${d.paid || 0}</td>
         <td>${Math.max(0, (Number(d.orders) - Number(d.paid || 0)))}</td>
<td>₹ ${round2(Number(d.payout))}</td>
<td>₹ ${round2(Number(d.paidAmount || 0))}</td>
<td>₹ ${round2(Number(d.payout) - Number(d.paidAmount || 0))}</td>

          ${isAdmin ? `<td class="btn-row">
            <a href="?setDayPaid=${encodeURIComponent(d.date)}
            &all=1">Mark day paid</a>
            <a href="?setDayPaid=${encodeURIComponent(d.date)}
            &n=0">Reset day</a>
          </td>` : ""}
        </tr>`).join("")}
    </tbody>
  </table>
  <div class="muted" style="margin-top:6px">
  JSON API: add <code>?format=json</code></div>
</div>

<div class="card">
  <h3>Recent orders</h3>
  <table>
    <thead><tr><th>When</th><th>Item</th><th>Qty (kg)
    </th><th>Payout</th></tr></thead>
    <tbody>
      ${recent.map((r) => `
        <tr>
          <td>${escapeHtml(r.when)}</td>
          <td>${escapeHtml(r.item ?? "-")}</td>
          <td>${round2(r.qtyKg)}</td>
          <td><b>₹ ${round2(r.payout)}</b></td>
        </tr>`).join("")}
    </tbody>
  </table>
</div>

${!isAdmin && viewerKey ? `
<div class="card">
  <div class="muted">Viewer link is scoped by
  secret <code>k</code>. Keep it private.</div>
</div>` : ""}
`;
}

/**
 * Promo dashboard with dual auth:
 * - Salesperson: must pass ?k=<viewerSecret> (per promo, read-only)
 * - Admin: pass header X-Admin-Key: <DASHBOARD_MASTER_KEY>, can adjust counters
 *
 * URL params:
 *   ?days=30           window
 *   ?format=json       JSON response
 * Admin-only actions:
 *   ?setDayPaid=YYYY-MM-DD&n=N   set paid orders for that day (0..orders)
 *   ?setDayPaid=YYYY-MM-DD&all=1 set that day fully paid
 */
export const promoStats = onRequest({
  secrets: ["DASHBOARD_MASTER_KEY"]}, async (req: Request, res: Response) => {
  try {
    const parts = req.path.split("/").filter(Boolean);
    const promoCode: string | undefined = parts[parts.length - 1];
    const viewerKey = String(req.query.k ?? "");
    const days = clamp(parseInt(String(req.query.days ?? "30"), 10) ||
    30, 1, 365);
    const wantJson = String(req.query.format ?? "").toLowerCase() === "json";

    const adminKeyHeader = (req.get("X-Admin-Key") || "").trim();
    const adminKey = process.env.DASHBOARD_MASTER_KEY; // string | undefined
    const isAdmin = !!adminKey && adminKeyHeader === adminKey;

    if (!promoCode) {
      res.status(400).send("Bad Request");
      return;
    }

    // 1) Verify promo
    const promoSnap = await db.collection("promocodes").doc(promoCode).get();
    if (!promoSnap.exists) {
      res.status(404).send("Promo not found");
      return;
    }
    const promo = promoSnap.data() as PromoDoc;
    if (promo.isActive === false) {
      res.status(403).send("Promo inactive");
      return;
    }

    // 2) Auth: viewer (k matches viewerSecret) OR admin header
    const viewerSecret = promo.viewerSecret || promo.secret || "";
    const isViewer = viewerSecret && viewerKey === viewerSecret;
    if (!isViewer && !isAdmin) {
      res.status(403).send("Forbidden");
      return;
    }

    // 3) Commission counter doc
    const totalsRef = db.collection("promo_commission_totals").doc(promoCode);
    const totalsSnap = await totalsRef.get();
    const daysPaidObj = (totalsSnap.get("days") as Record<string,
    { paidOrders?: number }> | null) || {};
    if (!totalsSnap.exists) {
      await totalsRef.set(
        {ordersPaid: 0, updatedAt: admin.firestore.FieldValue.
          serverTimestamp()},
        {merge: true}
      );
    }

    // Admin-only: parse desired day update
    const setDayRaw = String(req.query.setDayPaid ?? "").trim();
    const setDay = setDayRaw ? normalizeDayKey(setDayRaw) : "";
    const setDayAll = String(req.query.all ?? "").trim() === "1";
    const setDayNStr = String(req.query.n ?? "").trim();

    // 4) Time window
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    const sinceTs = admin.firestore.Timestamp.fromDate(since);

    // 5) Fetch orders
    const q = db
      .collection("orders")
      .where("promoCodeUsed", "==", promoCode)
      .where("paidAt", ">=", sinceTs)
      .orderBy("paidAt", "desc");

    const snap = await q.get();

    // 6) Build order list with qty & payout
    const orders: Array<{id: string; paidAt: Date;
      item: string; qtyKg: number; payout: number }> = [];
    snap.forEach((doc) => {
      const o = doc.data() as OrderDoc;
      const paidAt: Date = o.paidAt?.toDate?.() ?? new Date();

      const products = Array.isArray(o.products) ? o.products : [];
      let qtyKg = 0;

      if (products.length) {
        for (const p of products) {
          qtyKg += toNum(p.quantityKg ?? 0);
          if (!p.quantityKg && p.quantity) qtyKg += toNum(p.quantity) * 0.5;
        }
      } else {
        qtyKg = toNum(o.quantityKg ?? 0);
        if (!qtyKg && o.quantity) qtyKg = toNum(o.quantity) * 0.5;
        if (!qtyKg && o.unitPrice && o.lineTotal) {
          const units = toNum(o.lineTotal) / Math.max(1, toNum(o.unitPrice));
          qtyKg = units * 0.5;
        }
      }

      const payout = round2(qtyKg * 80); // ₹80 / kg
      const itemName = o.name ?? o.productTitle ?? (products[0]?.name ?? "-");

      orders.push({id: doc.id, paidAt, item: itemName,
        qtyKg: round2(qtyKg), payout});
    });

    // 7) Aggregate per day
    const dailyMap = new Map<string, DailyRow>();
    let totalPayout = 0;
    const recent: RecentRow[] = [];

    for (const o of orders) {
      totalPayout += o.payout;

      const dayKey = o.paidAt.toISOString().slice(0, 10);
      const prev = dailyMap.get(dayKey) ??
      {date: dayKey, orders: 0, payout: 0};
      prev.orders += 1;
      prev.payout += o.payout;
      dailyMap.set(dayKey, prev);

      if (recent.length < 25) {
        recent.push({
          id: o.id,
          when: o.paidAt.toISOString().replace("T", " ").slice(0, 19),
          item: o.item,
          qtyKg: o.qtyKg,
          payout: o.payout,
        });
      }
    }

    // Admin: handle day update now that we know per-day orders
    if (isAdmin && setDay) {
      const dayInfo = dailyMap.get(setDay);
      const dayOrders = dayInfo ? dayInfo.orders : 0;
      let newPaid = 0;
      if (setDayAll) {
        newPaid = dayOrders;
      } else if (setDayNStr) {
        newPaid = clamp(parseInt(setDayNStr, 10) || 0, 0, dayOrders);
      }
      const updateData: Record<string, unknown> = {};
      updateData["days." + setDay + ".paidOrders"] = newPaid;
      await totalsRef.set(
        {...updateData, updatedAt: admin.firestore.FieldValue.
          serverTimestamp()},
        {merge: true}
      );
      daysPaidObj[setDay] = {paidOrders: newPaid};
    }

    // Build daily array with paid/pending + amounts using daysPaidObj
    const daily = Array.from(dailyMap.values()).
      sort((a, b) => b.date.localeCompare(a.date));

    let sumPaidOrders = 0;
    let sumPaidAmount = 0;

    const dailyWithPaid = daily.map((d) => {
      const perOrder = d.orders ? d.payout / d.orders : 0;
      const paidForDay = clamp(toNum(daysPaidObj[d.date]?.
        paidOrders), 0, d.orders);
      const paidAmount = round2(perOrder * paidForDay);
      sumPaidOrders += paidForDay;
      sumPaidAmount += paidAmount;
      return {
        ...d,
        paid: paidForDay,
        paidAmount,
      };
    });

    // persist legacy ordersPaid as sum across days (for compatibility)
    if (isAdmin && (setDay || (!totalsSnap.exists))) {
      await totalsRef.set(
        {ordersPaid: sumPaidOrders, updatedAt: admin.firestore.
          FieldValue.serverTimestamp()},
        {merge: true}
      );
    }

    const totalOrders = daily.reduce((acc, d) => acc + d.orders, 0);
    const paidOrders = sumPaidOrders;
    const pendingOrders = Math.max(0, totalOrders - paidOrders);
    const totalPaidAmount = round2(sumPaidAmount);
    const totalPendingAmount = round2(totalPayout - totalPaidAmount);

    // 9) Respond
    if (wantJson) {
      res.json({
        promoCode,
        ownerId: promo.ownerId ?? null,
        actor: isAdmin ? "admin" : "viewer",
        windowDays: days,
        totals: {
          orders: totalOrders,
          payout: round2(totalPayout),
          paidOrders,
          pendingOrders,
          paidAmount: totalPaidAmount,
          pendingAmount: totalPendingAmount,
        },
        commissionCounter: {
          ordersPaid: paidOrders,
          days: Object.fromEntries(dailyWithPaid.map((d) => [d.date,
            {paidOrders: d.paid}])),
        },
        daily: dailyWithPaid.map((d) => ({
          date: d.date,
          orders: d.orders,
          paid: d.paid,
          pending: Math.max(0, d.orders - d.paid),
          payout: round2(d.payout),
          paidAmount: round2(d.paidAmount),
          pendingAmount: round2(d.payout - d.paidAmount),
        })),
        recent,
      });
      return;
    }

    const html = renderHtml({
      promoCode,
      ownerId: promo.ownerId ?? "-",
      days,
      totalOrders,
      totalPayout,
      paidOrders,
      pendingOrders,
      totalPaidAmount,
      totalPendingAmount,
      daily: dailyWithPaid as unknown as DailyRow[],
      recent,
      isAdmin,
      viewerKey,
    });

    res.status(200).set("Content-Type", "text/html").send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});
