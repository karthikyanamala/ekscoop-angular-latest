import {
  Component,
  OnInit,
  inject,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  getDocs,
  orderBy,
  query
} from '@angular/fire/firestore';
import { Router,RouterLink  } from '@angular/router';
import { ProfileHeaderComponent } from '../profile-header/profile-header.component';
import { CornerBadgeComponent } from '../../corner-badge/corner-badge.component';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, ProfileHeaderComponent, CornerBadgeComponent,RouterLink],
  templateUrl: './myorders.component.html',
  styleUrls: ['./myorders.component.css'],
})
export class MyOrdersComponent implements OnInit {
  auth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);
  router: Router = inject(Router);

  user: User | null = null;
  uid: string = '';
  orders: any[] = [];
  loadingOrders = false;
  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return; // ✅ Prevent everything on server

    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      this.user = user;
      this.uid = user.uid;

      await this.loadOrders(); // ✅ now safe
    });
  }

  async loadOrders() {
    if (!this.isBrowser) return; // ✅ Extra protection

    try {
      this.loadingOrders = true;
      console.log('[QuestionDetailComponent111] Fetching answers...');
      const ordersCol = collection(this.firestore, `users/${this.uid}/orders`);
      const q = query(ordersCol, orderBy('paidAt', 'desc'));
      const snap = await getDocs(q);

      this.orders = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      this.loadingOrders = false;
    }
  }
}
