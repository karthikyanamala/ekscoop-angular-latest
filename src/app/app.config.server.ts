import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { provideHttpClient} from "@angular/common/http";
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes),
  provideRouter(routes),
    provideHttpClient()
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
