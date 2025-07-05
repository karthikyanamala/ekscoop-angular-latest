import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, collection, getDocs, orderBy, query } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ProfileHeaderComponent } from '../profile-header/profile-header.component';
import { CornerBadgeComponent } from '../../corner-badge/corner-badge.component';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule,ProfileHeaderComponent,CornerBadgeComponent],
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

  ngOnInit() {
    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
      this.user = user;
      this.uid = user.uid;
      await this.loadOrders();
    });
  }

  async loadOrders() {
    try {
      this.loadingOrders = true;
      const ordersCol = collection(this.firestore, `users/${this.uid}/orders`);
      const q = query(ordersCol, orderBy('paidAt', 'desc'));
      const snap = await getDocs(q);
      this.orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      this.loadingOrders = false;
    }
  }
}
