import {
  Component, Inject, PLATFORM_ID, OnInit, inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div *ngIf="!isBrowser" class="wrap">
    <p>Loading…</p>
  </div>

  <div *ngIf="isBrowser" class="wrap">
    <a routerLink="/orders" class="back">← Back to My Orders</a>

    <header class="hero">
      <div class="hero-inner">
        <div class="hero-top">
          <h1 class="hero-title">
            Order <span class="mono">{{ orderId }}</span>
          </h1>
          <span class="status" [class.paid]="order?.paymentStatus==='paid'"
                               [class.pending]="order?.paymentStatus!=='paid'">
            {{ (order?.paymentStatus || 'unknown') | uppercase }}
          </span>
        </div>
        <div class="hero-meta" *ngIf="order">
          <div><strong>Paid At:</strong> {{ order.paidAt?.toDate() | date:'medium' }}</div>
          <div><strong>Total:</strong> ₹{{ order.amount }}</div>
          <div><strong>Payment ID:</strong> {{ order.razorpayPaymentId || '—' }}</div>
        </div>
      </div>
    </header>

    <ng-container *ngIf="loading; else loadedTpl">
      <div class="skeleton">
        <div class="s-line" *ngFor="let i of [1,2,3,4,5,6]"></div>
      </div>
    </ng-container>

    <ng-template #loadedTpl>
      <div *ngIf="error" class="error">{{ error }}</div>

      <section class="grid" *ngIf="order">
        <!-- Left column -->
        <div class="col">
          <!-- Tracking Card -->
          <div class="card track-card">
            <div class="card-head">
              <div class="card-title">
                <span class="icon-box">🚚</span>
                <div>
                  <h2>Shipment Tracking</h2>
                  <p class="muted">Get live updates for your delivery</p>
                </div>
              </div>
              <div class="pill" *ngIf="order.courier">{{ order.courier }}</div>
            </div>

            <div class="track-body">
              <div class="row">
                <span class="label">AWB</span>
                <span class="value mono" *ngIf="order.awb; else noAwb">{{ order.awb }}</span>
                <ng-template #noAwb>
                  <span class="value-muted">AWB number will be available soon. You’ll receive an SMS/email once it’s assigned.</span>
                </ng-template>
              </div>

              <div class="row" *ngIf="order.trackingUrl">
                <span class="label">Tracking Link</span>
                <a class="value link" [href]="order.trackingUrl" target="_blank" rel="noopener">Open tracking</a>
              </div>

              <div class="cta">
                <a class="btn" [class.btn-disabled]="!order.trackingUrl"
                   [attr.aria-disabled]="!order.trackingUrl"
                   [href]="order.trackingUrl || null" target="_blank" rel="noopener">
                  Track Package
                </a>
              </div>
            </div>
          </div>

          <!-- Items -->
          <div class="card">
            <div class="card-head tight">
              <h2>Items</h2>
            </div>
            <div class="items">
              <div class="item" *ngFor="let p of order.products">
                <img [src]="p.image" [alt]="p.name">
                <div class="info">
                  <div class="name">{{ p.name }}</div>
                  <div class="muted">Qty: {{ p.quantity }}</div>
                  <div class="price">₹{{ p.unitPrice }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right column -->
        <div class="col">
          <!-- Delivery Address -->
          <div class="card">
            <div class="card-head tight">
              <h2>Delivery Address</h2>
            </div>
            <div class="addr">
              <div class="pair"><span>Recipient</span><strong>{{ order.selectedAddress?.fullName || '—' }}</strong></div>
              <div class="pair"><span>Phone</span><strong>{{ order.selectedAddress?.phoneNumber || '—' }}</strong></div>
              <div class="pair"><span>Email</span><strong>{{ order.selectedAddress?.email || '—' }}</strong></div>
              <hr>
              <div class="pair"><span>Address</span><div class="block">
                {{ order.selectedAddress?.addressLine || '—' }}
                <span *ngIf="order.selectedAddress?.locality">, {{ order.selectedAddress?.locality }}</span>
              </div></div>
              <div class="pair"><span>City</span><strong>{{ order.selectedAddress?.city || '—' }}</strong></div>
              <div class="pair"><span>State</span><strong>{{ order.selectedAddress?.state || '—' }}</strong></div>
              <div class="pair"><span>Pincode</span><strong class="mono">{{ order.selectedAddress?.pincode || '—' }}</strong></div>
            </div>
          </div>

          <!-- Order Meta -->
          <div class="card">
            <div class="card-head tight">
              <h2>Order Summary</h2>
            </div>
            <div class="summary">
              <div class="pair"><span>Status</span>
                <span class="pill small" [class.paid]="order.paymentStatus==='paid'"
                                      [class.pending]="order.paymentStatus!=='paid'">
                  {{ (order.paymentStatus || 'unknown') | uppercase }}
                </span>
              </div>
              <div class="pair"><span>Order ID</span><span class="mono">{{ orderId }}</span></div>
              <div class="pair"><span>Amount</span><strong>₹{{ order.amount }}</strong></div>
              <div class="pair"><span>Paid At</span><span>{{ order.paidAt?.toDate() | date:'medium' }}</span></div>
              <div class="pair"><span>Payment ID</span><span class="mono">{{ order.razorpayPaymentId || '—' }}</span></div>
            </div>
          </div>
        </div>
      </section>
    </ng-template>
  </div>
  `,
  styles: [`
    :host { display:block; }
    .wrap { max-width: 1080px; margin: 24px auto 48px; padding: 0 16px; }

    .back {
      text-decoration: none; display:inline-block; margin: 8px 0 16px;
      color: #2c7be5;
    }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, #fff6e5, #f0f7ff);
      border: 1px solid #f1f1f1; border-radius: 16px;
      padding: 16px; box-shadow: 0 6px 24px rgba(0,0,0,0.05);
      margin-bottom: 16px;
    }
    .hero-inner { display:flex; flex-direction:column; gap:8px; }
    .hero-top { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
    .hero-title { font-size: 20px; margin: 0; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .status {
      padding: 6px 10px; border-radius: 999px; font-size: 12px;
      border: 1px solid #ddd; color: #6b6b6b; background:#fff;
    }
    .status.paid { border-color:#2ecc71; color:#2ecc71; }
    .status.pending { border-color:#f0ad4e; color:#f0ad4e; }
    .hero-meta { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:8px; }

    /* Grid layout */
    .grid { display:grid; grid-template-columns: 1.2fr 1fr; gap: 16px; margin-top: 12px; }
    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
    }
    .col { display: flex; flex-direction: column; gap: 16px; }

    /* Cards */
    .card {
      background: #fff; border:1px solid #eee; border-radius:16px; padding:16px;
      box-shadow: 0 8px 26px rgba(0,0,0,0.05);
    }
    .card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom: 10px; }
    .card-head.tight { margin-bottom: 6px; }
    .card-title { display:flex; align-items:center; gap:12px; }
    .icon-box {
      display:inline-grid; place-items:center;
      width:36px; height:36px; border-radius:10px; background:#f6f9ff; border:1px solid #e8eefc;
      font-size: 18px;
    }
    h2 { font-size: 18px; margin:0; }
    .muted { color:#6b7280; font-size: 13px; }

    .pill {
      padding: 6px 10px; border:1px solid #e4e4e4; border-radius:999px; font-size:12px; color:#444; background:#fff;
    }
    .pill.small { padding: 2px 8px; }

    /* Items */
    .items { display:grid; gap:12px; }
    .item { display:flex; gap:12px; border:1px solid #f1f1f1; border-radius:12px; padding:10px; }
    .item img { width:72px; height:72px; object-fit:cover; border-radius:10px; }
    .info { display:flex; flex-direction:column; justify-content:space-between; }
    .info .name { font-weight: 600; }
    .price { font-weight:600; }

    /* Tracking */
    .track-card .track-body { display:flex; flex-direction:column; gap:10px; }
    .row { display:grid; grid-template-columns: 120px 1fr; gap:10px; align-items:center; }
    .label { color:#6b7280; font-size:13px; }
    .value { font-weight: 600; }
    .value-muted { color:#6b7280; font-style: italic; }
    .link { color:#2c7be5; text-decoration:none; }

    .cta { margin-top: 8px; }
    .btn {
      display:inline-flex; align-items:center; justify-content:center;
      padding:10px 14px; border-radius:12px; background:#2c7be5; color:#fff; text-decoration:none;
      box-shadow: 0 6px 20px rgba(44,123,229,0.35); transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
    }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(44,123,229,0.45); }
    .btn-disabled { opacity: .5; pointer-events:none; }

    /* Address & Summary */
    .addr, .summary { display:grid; gap:10px; }
    .pair { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .pair > span:first-child { color:#6b7280; min-width:120px; }
    .block { white-space: pre-line; }
    hr { border:0; border-top:1px dashed #eee; margin: 6px 0 2px; }

    /* Loading skeleton */
    .skeleton { border:1px solid #eee; border-radius:16px; padding:16px; background:#fff; box-shadow: 0 6px 24px rgba(0,0,0,0.05); }
    .s-line {
      height: 12px; background: linear-gradient(90deg, #eee, #f6f6f6, #eee);
      border-radius: 8px; margin:10px 0; animation: shimmer 1.2s infinite linear;
    }
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: 200px 0; }
    }

    .error { color:#c92a2a; padding: 12px 0; }
  `]
})
export class OrderDetailComponent implements OnInit {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);

  isBrowser: boolean;
  user: User | null = null;
  uid = '';
  orderId = '';
  order: any | null = null;
  loading = true;
  error = '';

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.orderId = this.route.snapshot.paramMap.get('orderId') || '';

    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
      this.user = user;
      this.uid = user.uid;
      await this.fetchOrder();
    });
  }

  private async fetchOrder() {
    try {
      this.loading = true;
      this.error = '';
      const ref = doc(this.firestore, `users/${this.uid}/orders/${this.orderId}`);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        this.error = 'Order not found.';
        this.order = null;
        return;
      }

      this.order = { id: snap.id, ...snap.data() };
    } catch (e:any) {
      console.error(e);
      this.error = 'Failed to load order.';
    } finally {
      this.loading = false;
    }
  }
}
