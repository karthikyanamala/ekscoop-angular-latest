import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  inject
} from '@angular/core';
import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  addDoc
} from '@angular/fire/firestore';
import { ProfileHeaderComponent } from '../profile-header/profile-header.component';
import { CornerBadgeComponent } from '../../corner-badge/corner-badge.component';

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileHeaderComponent, CornerBadgeComponent],
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.css'],
})
export class AddressComponent implements OnInit {
  auth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);

  uid: string = '';
  loading = true;
  errorMessage = '';
  successMessage = '';
  isBrowser: boolean;

  addresses: any[] = [];

  showEditModal = false;
  showDeleteModal = false;
  selectedAddressId: string | null = null;

  addressForm: any = {
    fullName: '',
    email: '',
    phoneNumber: '',
    addressLine: '',
    locality: '',
    pincode: '',
    city: '',
    state: '',
    isDefault: false,
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        this.errorMessage = 'Please login first.';
        this.loading = false;
        return;
      }

      this.uid = user.uid;
      await this.loadAddresses();
    });
  }

  async loadAddresses() {
    if (!this.isBrowser) return;

    this.loading = true;
    try {
      console.log('[QuestionDetailComponent1234] Fetching answers...');
      const addrCol = collection(this.firestore, `users/${this.uid}/addresses`);
      const addrSnap = await getDocs(addrCol);
      this.addresses = addrSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Failed to load addresses:', error);
      this.errorMessage = 'Failed to load addresses.';
    } finally {
      this.loading = false;
    }
  }

  openEditModal(address: any) {
    this.selectedAddressId = address.id;
    this.addressForm = { ...address };
    this.showEditModal = true;
  }

  openNewAddressModal() {
    this.selectedAddressId = null;
    this.addressForm = {
      fullName: '',
      email: '',
      phoneNumber: '',
      addressLine: '',
      locality: '',
      pincode: '',
      city: '',
      state: '',
      isDefault: false,
    };
    this.showEditModal = true;
  }

  async saveAddress() {
    if (!this.isBrowser) return;

    try {
      if (this.selectedAddressId) {
        const addrDoc = doc(this.firestore, `users/${this.uid}/addresses/${this.selectedAddressId}`);
        await setDoc(addrDoc, this.addressForm);
      } else {
        console.log('[QuestionDetailComponent0987] Fetching answers...');
        const addrCol = collection(this.firestore, `users/${this.uid}/addresses`);
        await addDoc(addrCol, this.addressForm);
      }
      this.showEditModal = false;
      await this.loadAddresses();
    } catch (error) {
      console.error('Failed to save address:', error);
      this.errorMessage = 'Failed to save address.';
    }
  }

  confirmDelete(addressId: string) {
    this.selectedAddressId = addressId;
    this.showDeleteModal = true;
  }

  async deleteAddress() {
    if (!this.isBrowser) return;

    try {
      const addrDoc = doc(this.firestore, `users/${this.uid}/addresses/${this.selectedAddressId}`);
      await deleteDoc(addrDoc);
      this.showDeleteModal = false;
      await this.loadAddresses();
    } catch (error) {
      console.error('Failed to delete address:', error);
      this.errorMessage = 'Failed to delete address.';
    }
  }
}
