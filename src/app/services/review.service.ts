import { Injectable, Inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import {
  Firestore, collection, getDocs, query, where, orderBy, limit, doc, onSnapshot, getDoc
} from '@angular/fire/firestore';
import { Functions, httpsCallable, getFunctions } from '@angular/fire/functions';
import { Review } from '../model/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly REVIEWS_PATH = 'reviews';
  private readonly ELIG_PATH = 'review_eligibility';

  private isBrowser = false;

  user = signal<User | null>(null);
  reviews = signal<Review[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  private profileName = signal<string>('');

  eligibilityRemaining = signal<number>(0);
  eligibilityOrders = signal<Record<string, boolean>>({});
  private eligUnsub: (() => void) | null = null;

  displayName = computed(() => {
    const cached = this.profileName();
    const u = this.user();
    if (cached) return cached;
    if (u?.displayName) return u.displayName;
    if (u?.email) return u.email.split('@')[0];
    return 'Customer';
  });

  averageRating = computed(() => {
    const arr = this.reviews();
    if (!arr.length) return 0;
    return +(arr.reduce((s, r) => s + r.rating, 0) / arr.length).toFixed(1);
  });

  breakdown = computed(() => {
    const total = Math.max(this.reviews().length, 1);
    return [5,4,3,2,1].map(stars => {
      const count = this.reviews().filter(r => r.rating === stars).length;
      return { rating: stars, count, percentage: Math.round((count / total) * 100) };
    });
  });

  constructor(
    private fs: Firestore,
    private auth: Auth,
    private fns: Functions,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      onAuthStateChanged(this.auth, (u) => {
        this.user.set(u);
        this.profileName.set(u?.displayName || '');
        this.stopEligibilityListener();
        if (u) {
          this.startEligibilityListener(u.uid);
          this.loadProfileName(u.uid);
        }
      });
    }
  }

  private async loadProfileName(uid: string) {
    if (!this.isBrowser) return;
    try {
      const ref = doc(this.fs, `users/${uid}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d: any = snap.data();
        const n = d?.fullName || d?.name || d?.displayName || '';
        if (n) this.profileName.set(n);
      }
    } catch { /* ignore */ }
  }

  private startEligibilityListener(uid: string) {
    const ref = doc(this.fs, `${this.ELIG_PATH}/${uid}`);
    this.eligUnsub = onSnapshot(ref, (snap) => {
      const d = snap.data() as any;
      this.eligibilityRemaining.set(d?.remaining || 0);
      this.eligibilityOrders.set(d?.orders || {});
    }, () => {
      this.eligibilityRemaining.set(0);
      this.eligibilityOrders.set({});
    });
  }

  private stopEligibilityListener() {
    if (this.eligUnsub) { this.eligUnsub(); this.eligUnsub = null; }
    this.eligibilityRemaining.set(0);
    this.eligibilityOrders.set({});
  }

  async loadReviews(max = 200) {
    if (!this.isBrowser) { this.loading.set(false); return; }

    try {
      this.loading.set(true);
      const col = collection(this.fs, this.REVIEWS_PATH);
      const qy = query(
        col,
        where('status', 'in', ['approved', 'pending']),
        orderBy('createdAt', 'desc'),
        limit(max)
      );
      const snap = await getDocs(qy);
      const items: Review[] = snap.docs.map(d => {
        const x = d.data() as any;
        return {
          id: d.id,
          uid: x.uid,
          orderId: x.orderId,
          name: x.name,
          rating: x.rating,
          text: x.text,
          status: x.status || 'approved',
          createdAt: x.createdAt
        };
      });
      this.reviews.set(items);
      this.error.set(null);
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      if (e?.code === 'failed-precondition' && msg.includes('index')) {
        this.error.set('Building reviews index… try again in a minute.');
      } else {
        this.error.set(e?.message ?? 'Failed to load reviews');
      }
    } finally {
      this.loading.set(false);
    }
  }

  /** Call submitReview specifically in asia-south1 (others can stay us-central1). */
  async submitReviewForOrder(
    orderId: string,
    payload: { name: string; rating: number; text: string; }
  ) {
    const u = this.user();
    if (!u) throw new Error('Not signed in');

    const fnsAsia = getFunctions(undefined, 'asia-south1');
    const callable = httpsCallable(fnsAsia, 'submitReview');

    await callable({ orderId, ...payload });
    await this.loadReviews();
  }

  // --- Add to src/app/services/review.service.ts ---

// Only APPROVED reviews for public-facing widgets (showcase, home, etc.)
publicReviews = computed(() => this.reviews().filter(r => r.status === 'approved'));

publicAverageRating = computed(() => {
  const arr = this.publicReviews();
  if (!arr.length) return 0;
  return +(arr.reduce((s, r) => s + r.rating, 0) / arr.length).toFixed(1);
});

publicCount = computed(() => this.publicReviews().length);

}
