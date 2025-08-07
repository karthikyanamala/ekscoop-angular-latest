import { appConfig as baseConfig } from './app/app.config';
import { provideServerRendering } from '@angular/platform-server';
import { Firestore } from '@angular/fire/firestore';

const emptyFirestoreStub = {
  collection: () => ({}),
  doc: () => ({}),
};

export const serverAppConfig = {
  ...baseConfig,
  providers: [
    ...baseConfig.providers,
    provideServerRendering(),
    { provide: Firestore, useValue: emptyFirestoreStub },
  ],
};

export { AppComponent } from './app/app.component';
export { serverAppConfig as appConfig };
