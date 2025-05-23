import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { provideHttpClient } from "@angular/common/http";
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),  provideFirebaseApp(() => initializeApp(environment.firebase)),
    // Provide Firestore service
    provideFirestore(() => getFirestore()),
    provideAnimations(),
    provideHttpClient(), provideClientHydration(withEventReplay())]
};
