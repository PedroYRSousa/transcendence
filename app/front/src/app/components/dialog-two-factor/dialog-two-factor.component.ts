import { Component, Inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { GetSixDigitsComponent } from './components/get-six-digits/get-six-digits.component';
import { GenerateQRCodeComponent } from './components/generate-qrcode/generate-qrcode.component';

export interface I_DialogTwoFactorData {
	hashed_id: string;
	generateQRCode: boolean;
}

@Component({
	selector: 'app-dialog-two-factor',
	standalone: true,
	imports: [GenerateQRCodeComponent, GetSixDigitsComponent],
	templateUrl: './dialog-two-factor.component.html',
})
export class DialogTwoFactorComponent {
	public hashed_id = '';
	public toShowQRCode = false;
	public generateQRCode = false;

	constructor(@Inject(MAT_DIALOG_DATA) private readonly data: I_DialogTwoFactorData, private readonly dialogRef: MatDialogRef<DialogTwoFactorComponent>) {
		this.hashed_id = data.hashed_id;
		this.toShowQRCode = data.generateQRCode === true;
		this.generateQRCode = data.generateQRCode === true;
	}

	close = (result: boolean = false) => {
		this.dialogRef.close(result);
	};

	toGetSixDigits = () => {
		this.toShowQRCode = false;
	};

	toGenerateQrCode = () => {
		this.toShowQRCode = true;
	};
}
