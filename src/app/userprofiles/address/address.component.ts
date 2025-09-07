import {
  Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router'; // optional if you use routerLink inside
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import {
  Firestore, collection, getDocs, doc, setDoc, deleteDoc, addDoc
} from '@angular/fire/firestore';
import { ProfileHeaderComponent } from '../profile-header/profile-header.component';
import { CornerBadgeComponent } from '../../corner-badge/corner-badge.component';

import { HttpClientModule } from '@angular/common/http';
import { Subject, of, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, tap, catchError } from 'rxjs/operators';
import { DelhiveryService, PinLookupDto } from '../../services/delhivery.service';

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ProfileHeaderComponent, CornerBadgeComponent],
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.css'],
})
export class AddressComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  auth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);

  uid = '';
  loading = true;
  errorMessage = '';
  successMessage = '';

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

  // Pincode lookup
  private pinInput$ = new Subject<string>();
  private subs = new Subscription();

  pinStatus: 'idle' | 'checking' | 'ok' | 'not_serviceable' | 'error' = 'idle';
  lastResolvedPin: string | null = null;

  constructor(private delhivery: DelhiveryService) {}

  ngOnInit(): void {
    // ❗ Never touch Firebase/HTTP streams on the server
    if (!this.isBrowser) {
      // render a simple SSR skeleton
      this.loading = false;
      return;
    }

    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        this.errorMessage = 'Please login first.';
        this.loading = false;
        return;
      }
      this.uid = user.uid;
      await this.loadAddresses();
    });

    // Debounced pincode lookup stream
    const pinSub = this.pinInput$.pipe(
      debounceTime(300),
      map(v => (v || '').trim()),
      distinctUntilChanged(),
      tap(v => {
        if (!/^\d{6}$/.test(v)) this.pinStatus = 'idle';
      }),
      filter(v => /^\d{6}$/.test(v)),
      tap(() => { this.pinStatus = 'checking'; }),
      switchMap(pin =>
        this.delhivery.lookup(pin).pipe(
          catchError(err => {
            console.error('pin lookup failed', err);
            this.pinStatus = 'error';
            return of({ ok: false } as PinLookupDto);
          })
        )
      )
    ).subscribe((resp: PinLookupDto) => {
      if (!resp?.ok) { this.pinStatus = 'error'; return; }

      if (this.lastResolvedPin !== resp.pin) {
        this.addressForm.city  = (resp.city  || '').toUpperCase();
        this.addressForm.state = (resp.state || '').toUpperCase();
        this.lastResolvedPin = resp.pin ?? null;
      }
      const canShip = !!resp.serviceable;
      this.pinStatus = canShip ? 'ok' : 'not_serviceable';
    });

    this.subs.add(pinSub);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  async loadAddresses() {
    if (!this.isBrowser) return;
    this.loading = true;
    try {
      const addrCol = collection(this.firestore, `users/${this.uid}/addresses`);
      const snap = await getDocs(addrCol);
      this.addresses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Failed to load addresses:', err);
      this.errorMessage = 'Failed to load addresses.';
    } finally {
      this.loading = false;
    }
  }

  openEditModal(address: any) {
    this.selectedAddressId = address.id;
    this.addressForm = { ...address };
    this.pinStatus = 'idle';
    this.lastResolvedPin = null;
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
    this.pinStatus = 'idle';
    this.lastResolvedPin = null;
    this.showEditModal = true;
  }

  onPinChange(v: string) {
    this.addressForm.pincode = v;
    if ((v || '').length <= 6) this.pinInput$.next(v);
  }

  canSave(formValid: boolean | null): boolean {
    return !!formValid && this.pinStatus !== 'not_serviceable' && this.pinStatus !== 'error';
  }

  async saveAddress(form: NgForm) {
    if (!this.isBrowser) return;
    if (form?.invalid) { form.control.markAllAsTouched(); return; }
    if (this.pinStatus === 'not_serviceable' || this.pinStatus === 'error') return;

    try {
      if (this.selectedAddressId) {
        const addrDoc = doc(this.firestore, `users/${this.uid}/addresses/${this.selectedAddressId}`);
        await setDoc(addrDoc, this.addressForm);
      } else {
        const addrCol = collection(this.firestore, `users/${this.uid}/addresses`);
        await addDoc(addrCol, this.addressForm);
      }
      this.showEditModal = false;
      await this.loadAddresses();
    } catch (err) {
      console.error('Failed to save address:', err);
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
    } catch (err) {
      console.error('Failed to delete address:', err);
      this.errorMessage = 'Failed to delete address.';
    }
  }
}
