import { Component, Input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { I_Error } from '../../../../app.component';
import { UserService } from '../../../../services/user/user.service';
import { HttpService } from '../../../../services/http/http.service';
import { ErrorService } from '../../../../services/error/error.service';

@Component({
	selector: 'app-get-six-digits',
	standalone: true,
	imports: [MatSnackBarModule, MatCardModule, MatFormFieldModule, MatButtonModule, MatProgressSpinnerModule, MatInputModule, FormsModule, ReactiveFormsModule],
	templateUrl: './get-six-digits.component.html',
	styleUrl: './get-six-digits.component.scss',
})
export class GetSixDigitsComponent {
	toLoading = false;
	twoFactorCode = new FormControl('', [Validators.required]);
	matcher = new ErrorStateMatcher();
	@Input({ required: true }) generateQRCode!: boolean;
	@Input({ required: true }) closeDialog!: () => void;
	@Input({ required: false }) hashed_id: string | null = null;
	@Input({ required: true }) nextDialog!: (result: boolean) => void;
	private readonly digitsAllowed = [
		'Digit0',
		'Digit1',
		'Digit2',
		'Digit3',
		'Digit3',
		'Digit4',
		'Digit5',
		'Digit6',
		'Digit7',
		'Digit8',
		'Digit9',
		'Numpad0',
		'Numpad1',
		'Numpad2',
		'Numpad3',
		'Numpad4',
		'Numpad5',
		'Numpad6',
		'Numpad7',
		'Numpad8',
		'Numpad9',
	];

	constructor(private readonly userService: UserService, private readonly errorService: ErrorService) {}

	handleKeypress(ev: KeyboardEvent) {
		return this.digitsAllowed.includes(ev.code);
	}

	twoFactorCodeResult(data: Object | I_Error) {
		this.toLoading = false;

		if (HttpService.checkIsError(data)) {
			this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
			this.twoFactorCode.addValidators(Validators.email);
			return;
		}

		this.nextDialog(true);
	}

	close() {
		this.closeDialog();
	}

	next() {
		this.twoFactorCode.removeValidators(Validators.email);
		this.twoFactorCode.updateValueAndValidity();

		if (!this.twoFactorCode.valid) return;

		this.toLoading = true;

		const twoFactorCode = parseInt(this.twoFactorCode.value!);

		if (this.generateQRCode) this.userService.activeTwoFactor(twoFactorCode).subscribe((r) => this.twoFactorCodeResult(r));
		else if (this.hashed_id) this.userService.validTwoFactor(twoFactorCode, this.hashed_id).subscribe((r) => this.twoFactorCodeResult(r));
		else this.userService.deactivateTwoFactor(twoFactorCode).subscribe((r) => this.twoFactorCodeResult(r));
	}
}
