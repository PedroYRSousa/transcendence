import { AfterViewInit, Component, Input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { I_Error } from '../../../../app.component';
import { UserService } from '../../../../services/user/user.service';
import { HttpService } from '../../../../services/http/http.service';
import { ErrorService } from '../../../../services/error/error.service';

@Component({
	selector: 'app-generate-qrcode',
	standalone: true,
	imports: [MatProgressSpinnerModule, MatButtonModule, MatCardModule, MatSnackBarModule],
	templateUrl: './generate-qrcode.component.html',
	styleUrl: './generate-qrcode.component.scss',
})
export class GenerateQRCodeComponent implements AfterViewInit {
	public pathQRCode: string | null = null;
	@Input({ required: true }) nextDialog!: () => void;
	@Input({ required: true }) closeDialog!: () => void;

	constructor(private readonly userService: UserService, private readonly errorService: ErrorService) {}

	ngAfterViewInit(): void {
		this.generateQRCodeTwoFactor();
	}

	generateQRCodeTwoFactor() {
		this.userService.generateTwoFactor().subscribe((data) => {
			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this.setPathQRCode(data);
		});
	}

	setPathQRCode(data: any) {
		const { pathQRCode } = data;

		if (!pathQRCode) return;

		this.pathQRCode = pathQRCode;
	}

	close() {
		this.closeDialog();
	}

	next() {
		this.nextDialog();
	}
}
