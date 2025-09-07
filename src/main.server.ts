import 'zone.js/node';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/platform-server';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

export default function () {
  return bootstrapApplication(AppComponent, {
    providers: [
      provideServerRendering(),
      ...appConfig.providers!,  // ✅ reuse same providers on the server
    ],
  });
}
