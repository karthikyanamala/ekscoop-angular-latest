import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter,withInMemoryScrolling  } from '@angular/router';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideFunctions, getFunctions } from '@angular/fire/functions';

import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

// ❌ REMOVE any stray global initializeApp(environment.firebase) calls

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top', // always go to top on navigation
        anchorScrolling: 'enabled',
       
      })),

    // ✅ Firebase (single place)
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),

    provideHttpClient(),
    provideAnimations(),
    provideClientHydration(withEventReplay()),
  ],
};
