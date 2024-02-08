// src/app/auth/auth-guard.service.ts
import { Injectable } from '@angular/core';

import { TokenService } from '../token/token.service';
import { RoutesService } from '../routes/routes.service';

@Injectable()
export class AuthGuardService {
	constructor(private readonly tokenService: TokenService, private readonly routesService: RoutesService) {}

	canMatch(): boolean {
		if (this.tokenService.getToken()) {
			this.routesService.toHome();
			return false;
		}

		return true;
	}

	canActivate(): boolean {
		if (!this.tokenService.getToken()) {
			this.routesService.toLogin();
			return false;
		}

		return true;
	}

	canActivateChild(): boolean {
		return this.canActivate();
	}
}
