import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, map, retryWhen, switchMap, take } from 'rxjs/operators';

export interface PinLookupDto {
  ok: boolean;
  pin?: string;
  city?: string;
  state?: string;
  /** Backend returns a single boolean for prepaid serviceability */
  serviceable?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DelhiveryService {
  /** Use full URL in dev; you can switch to `/api/pincodeLookup` if you set up a dev proxy */
  private baseUrl = 'https://us-central1-ekscoop-website.cloudfunctions.net/pincodeLookup';
  private isBrowser: boolean;

  /** Tiny in-memory cache to reduce duplicate calls during typing */
  private cache = new Map<string, PinLookupDto>();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  lookup(pin: string): Observable<PinLookupDto> {
    if (!this.isBrowser) return of({ ok: false });
    const key = (pin || '').trim();
    if (!/^\d{6}$/.test(key)) return of({ ok: false });

    const cached = this.cache.get(key);
    if (cached) return of(cached);

    return this.http.get<PinLookupDto>(`${this.baseUrl}?pin=${encodeURIComponent(key)}`).pipe(
      // simple retry w/ backoff for transient errors
      retryWhen(errors =>
        errors.pipe(
          switchMap((err: HttpErrorResponse, i) =>
            i < 2 ? timer(250 * (i + 1)) : throwError(() => err)
          ),
          take(2)
        )
      ),
      map(resp => {
        if (resp?.ok) this.cache.set(key, resp);
        return resp;
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Delhivery lookup failed', err);
        return of({ ok: false } as PinLookupDto);
      })
    );
  }
}
