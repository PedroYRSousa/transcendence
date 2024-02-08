import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ChatService } from '../../../../../../../../services/chat/chat.service';
import { HttpService } from '../../../../../../../../services/http/http.service';

@Component({
	selector: 'app-dialog-create-chat',
	standalone: true,
	imports: [
		FormsModule,
		MatCardModule,
		MatIconModule,
		MatRadioModule,
		MatInputModule,
		MatButtonModule,
		MatSnackBarModule,
		MatCheckboxModule,
		MatFormFieldModule,
		MatProgressSpinnerModule,
	],
	templateUrl: './dialog-create-chat.component.html',
	styleUrl: './dialog-create-chat.component.scss',
})
export class DialogCreateChatComponent {
	name: string = '';
	password: string | null = null;
	passwordConfirm: string | null = null;
	isPublic: boolean = true;
	isProtect: boolean = false;
	showPassword: boolean = false;
	loading: boolean = false;

	constructor(private readonly chatService: ChatService, private readonly _snackBar: MatSnackBar, public dialogRef: MatDialogRef<DialogCreateChatComponent>) {}

	create() {
		if (!this.isProtect) {
			this.password = null;
			this.passwordConfirm = null;
		} else {
			if (!this.password) {
				this._snackBar.open('Para ser protegido precisa-se de uma senha');
				return;
			}
			if (this.password !== this.passwordConfirm) {
				this._snackBar.open('As senhas não combinam');
				return;
			}
		}

		this.loading = true;

		this.chatService.create(this.name, this.isPublic, this.isProtect, this.password).subscribe((data) => {
			this.loading = false;

			if (HttpService.checkIsError(data)) this.dialogRef.close(data);
			else this.dialogRef.close(null);
		});
	}

	toggleShowPassword() {
		this.showPassword = !this.showPassword;
	}
}
