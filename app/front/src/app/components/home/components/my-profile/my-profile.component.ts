import { FormsModule } from '@angular/forms';
import { AfterViewInit, Component } from '@angular/core';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { I_Error } from '../../../../app.component';
import { HttpService } from '../../../../services/http/http.service';
import { TokenService } from '../../../../services/token/token.service';
import { ErrorService } from '../../../../services/error/error.service';
import { I_User, UserService } from '../../../../services/user/user.service';
import { DialogTwoFactorComponent } from '../../../dialog-two-factor/dialog-two-factor.component';

@Component({
	selector: 'app-my-profile',
	standalone: true,
	imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatButtonModule, MatSnackBarModule],
	templateUrl: './my-profile.component.html',
	styleUrl: './my-profile.component.scss',
})
export class MyProfileComponent implements AfterViewInit {
	public loading: boolean = false;
	public iam: I_User | null = null;
	public fileSelected: File | null = null;
	public fileSelectedUrl: string | null = null;

	constructor(
		private readonly userService: UserService,
		private readonly tokenService: TokenService,
		private readonly errorService: ErrorService,
		private readonly _snackBar: MatSnackBar,
		private readonly dialog: MatDialog,
	) {}

	ngAfterViewInit(): void {
		this.getMy();
	}

	getMy() {
		this.userService.my().subscribe((data) => {
			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogout(data as I_Error);
				return;
			}

			this.iam = data as I_User;
		});
	}

	openFile() {
		const inputFile = document.createElement('input');
		inputFile.type = 'file';
		inputFile.accept = 'image/png, image/gif, image/jpeg, image/webp';

		inputFile.addEventListener('change', () => {
			this.fileSelected = null;
			this.fileSelectedUrl = null;

			if (!inputFile.files) return;
			if (inputFile.files.length <= 0) return;

			this.fileSelected = inputFile.files[0];
			this.fileSelectedUrl = URL.createObjectURL(this.fileSelected);
		});
		inputFile.click();
	}

	deactivateTFA() {
		this.dialog
			.open(DialogTwoFactorComponent, { data: { generateQRCode: false } })
			.afterClosed()
			.subscribe((success) => {
				if (success) {
					alert('Autenticação de dois fatore desativada com sucesso');
					this.tokenService.logout();
				} else this._snackBar.open('Autenticação de dois fatores falhou!');
			});
	}

	activeTFA() {
		this.dialog
			.open(DialogTwoFactorComponent, { data: { generateQRCode: true } })
			.afterClosed()
			.subscribe((success) => {
				if (success) {
					alert('Autenticação de dois fatore ativada com sucesso');
					this.tokenService.logout();
				} else this._snackBar.open('Autenticação de dois fatores falhou!');
			});
	}

	saveChanges() {
		if (!this.iam) return;

		var fd = new FormData();
		if (this.fileSelected) fd.append('file', this.fileSelected);
		fd.append('displayName', this.iam.displayName);

		this.loading = true;

		this.userService.update(fd).subscribe((data) => {
			this.loading = false;

			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this._snackBar.open('Informações atualizadas com sucesso');
		});
	}
}
