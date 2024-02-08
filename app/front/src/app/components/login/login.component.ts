import { Component, OnInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TokenService } from '../../services/token/token.service';
import { RoutesService } from '../../services/routes/routes.service';
import { CookieService } from '../../services/cookie/cookie.service';
import { DialogTwoFactorComponent } from '../dialog-two-factor/dialog-two-factor.component';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [MatButtonModule, MatSnackBarModule],
	templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
	constructor(
		private readonly dialog: MatDialog,
		private readonly _snackBar: MatSnackBar,
		private readonly tokenService: TokenService,
		private readonly cookieService: CookieService,
		private readonly routesService: RoutesService,
	) {}

	ngOnInit(): void {
		const twoCodeRequest = this.cookieService.getTwoFactorRequest();

		if (twoCodeRequest) {
			this.dialog
				.open(DialogTwoFactorComponent, { data: { generateQRCode: false, hashed_id: twoCodeRequest.hashed_id } })
				.afterClosed()
				.subscribe((success) => {
					this.cookieService.clearTwoFactorRequest();

					if (success) this.routesService.toHome();
					else this._snackBar.open('Autenticação de dois fatores falhou!');
				});
		}
	}

	login() {
		this.tokenService.login();
	}
}
