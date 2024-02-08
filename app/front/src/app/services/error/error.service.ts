import { Injectable } from '@angular/core';
import { I_Error } from '../../app.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TokenService } from '../token/token.service';

@Injectable({
	providedIn: 'root',
})
export class ErrorService {
	constructor(private readonly _snackBar: MatSnackBar, private readonly tokenService: TokenService) {}

	handleErrorSnackBar(err: I_Error) {
		const { message, error } = err;

		const displayMessage = message ? message : error;

		this._snackBar.open(displayMessage, 'Ok', { duration: 5000 });
	}

	handleErrorLogout(err: I_Error) {
		const { message, error } = err;

		const displayMessage = message ? message : error;

		alert(displayMessage);
		this.tokenService.logout();
	}

	handleErrorLogoutOrSnackBar(err: I_Error) {
		const { message, error, status, statusCode } = err;

		const errorCode = statusCode ? statusCode : status;
		const displayMessage = message ? message : error;

		if (errorCode === 401) {
			alert(displayMessage);

			this.tokenService.logout();
		} else {
			this._snackBar.open(displayMessage, 'Ok', { duration: 5000 });
		}
	}
}
