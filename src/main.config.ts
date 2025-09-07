import { appConfig as baseConfig } from './app/app.config';
import { provideServerRendering } from '@angular/platform-server';

export const serverAppConfig = {
  ...baseConfig,
  providers: [
    ...baseConfig.providers!,
    provideServerRendering(),
  ],
};

export { AppComponent } from './app/app.component';
export { serverAppConfig as appConfig };
