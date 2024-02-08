import { Component, Inject } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { I_User } from '../../../../../../services/user/user.service';

@Component({
	selector: 'app-dialog-invite',
	standalone: true,
	imports: [MatButtonModule, MatCardModule],
	templateUrl: './dialog-invite.component.html',
	styleUrl: './dialog-invite.component.scss',
})
export class DialogInviteComponent {
	public invite: I_User;

	constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<DialogInviteComponent>) {
		const { invite } = data;

		this.invite = invite;
	}

	close(result: boolean) {
		this.dialogRef.close(result);
	}
}
