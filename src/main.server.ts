import 'zone.js/node';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { serverAppConfig } from './main.config';

export default function () {
  return bootstrapApplication(AppComponent, serverAppConfig);
}
