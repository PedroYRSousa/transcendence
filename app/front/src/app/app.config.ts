import { provideRouter } from '@angular/router';
import { ApplicationConfig } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withJsonpSupport } from '@angular/common/http';

import { routes } from './app.routes';
import { TokenService } from './services/token/token.service';
import { AuthGuardService } from './services/AuthGuardService/auth-guard-service.service';
import { RoutesService } from './services/routes/routes.service';
import { HttpService } from './services/http/http.service';
import { WebsocketService } from './services/websocket/websocket.service';

const modules: any = [];
const services: any = [CookieService, TokenService, AuthGuardService, RoutesService, HttpService, WebsocketService];

export const appConfig: ApplicationConfig = {
	providers: [provideRouter(routes), provideAnimations(), provideHttpClient(withJsonpSupport()), ...services, ...modules],
};
