export interface Review {
  id?: string;        // `${uid}_${orderId}`
  uid: string;
  orderId: string;
  name: string;
  rating: number;     // 1..5
  text: string;
  status?: 'approved' | 'pending';
  createdAt: any;     // Firestore Timestamp | Date after mapping
}
