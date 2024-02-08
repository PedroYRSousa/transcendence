import { Component, Inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChatService, I_Chat } from '../../../../../../../../services/chat/chat.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { I_User, UserService } from '../../../../../../../../services/user/user.service';
import { ListMembersComponent } from './components/list-members/list-members.component';
import { DialogCreateChatComponent } from '../../../list-chat/components/dialog-create-chat/dialog-create-chat.component';
import { ErrorService } from '../../../../../../../../services/error/error.service';
import { HttpService } from '../../../../../../../../services/http/http.service';
import { I_Error } from '../../../../../../../../app.component';
import { EventsService } from '../../../../../../../../services/events/events.service';

export interface I_DialogSettingsData {
	iam: I_User;
	chat: I_Chat;
}

@Component({
	selector: 'app-dialog-settings',
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
		MatInputModule,
		ListMembersComponent,
	],
	templateUrl: './dialog-settings.component.html',
	styleUrl: './dialog-settings.component.scss',
})
export class DialogSettingsComponent {
	public chat!: I_Chat;
	public iam!: I_User;
	public loading: boolean = false;
	public showPassword: boolean = false;
	public password: string | null = null;
	public members: I_User[] = [];
	public passwordConfirm: string | null = null;

	constructor(
		@Inject(MAT_DIALOG_DATA) private readonly data: I_DialogSettingsData,
		public dialogRef: MatDialogRef<DialogCreateChatComponent>,
		private readonly userService: UserService,
		private readonly chatService: ChatService,
		private readonly errorService: ErrorService,
		private readonly _snackBar: MatSnackBar,
	) {
		this.chat = data.chat;
		this.iam = data.iam;

		this.getUsers();
	}

	save() {
		if (!this.chat.protected) {
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

		this.chatService.update(this.chat.id, this.chat.name, this.chat.public, this.chat.protected, this.password).subscribe((data) => {
			this.loading = false;

			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}
		});
	}

	exit() {
		this.loading = true;

		this.chatService.exit(this.chat.id).subscribe((data) => {
			this.loading = false;

			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this.dialogRef.close();
			EventsService.eventExitChat.detail.chat = this.chat;
			dispatchEvent(EventsService.eventExitChat);
		});
	}

	getUsers() {
		if (this.chat.kicks.length <= 0) this.members = this.chat.members!;

		for (const kick of this.chat.kicks) {
			this.userService.get(kick).subscribe((user) => {
				if (HttpService.checkIsError(user)) {
					this.errorService.handleErrorSnackBar(user as I_Error);
					return;
				}

				this.chat.members!.push(user as I_User);

				if (this.chat.kicks.indexOf(kick) === this.chat.kicks.length - 1) this.members = this.chat.members!;
			});
		}
	}

	isMy() {
		return this.chat.owner === this.iam.id;
	}

	isIamAdmin() {
		return this.chat.admins.includes(this.iam.id);
	}

	addAdmin(user: I_User) {
		this.loading = true;

		this.chatService.addAdmin(this.chat.name, user).subscribe((data) => {
			this.loading = false;

			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this.chat.admins.push(user.id);
		});
	}

	removeAdmin(user: I_User) {
		this.loading = true;

		this.chatService.removeAdmin(this.chat.name, user).subscribe((data) => {
			this.loading = false;

			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this.chat.admins = this.chat.admins.filter((a) => a !== user.id);
		});
	}

	removeMember(user: I_User) {
		this.loading = true;

		this.chatService.removeMember(this.chat.name, user).subscribe((data) => {
			this.loading = false;

			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this.chat.members = this.chat.members!.filter((m) => m.id !== user.id);
			this.chat.admins = this.chat.admins.filter((a) => a !== user.id);
			this.chat.mutes = this.chat.mutes.filter((a) => a !== user.id);
			this.members = this.members!.filter((m) => m.id !== user.id);
		});
	}

	kick(user: I_User) {
		this.loading = true;

		this.chatService.kick(this.chat.name, user).subscribe((data) => {
			this.loading = false;

			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this.chat.kicks.push(user.id);
			this.chat.admins = this.chat.admins.filter((a) => a !== user.id);
			this.chat.members = this.chat.members!.filter((m) => m.id !== user.id);
		});
	}

	unKick(user: I_User) {
		this.loading = true;

		this.chatService.unKick(this.chat.name, user).subscribe((data) => {
			this.loading = false;

			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this.chat.kicks = this.chat.kicks.filter((a) => a !== user.id);
			this.members = this.members!.filter((m) => m.id !== user.id);
			this.chat.members = this.chat.members!.filter((m) => m.id !== user.id);
		});
	}

	mute(user: I_User) {
		this.loading = true;

		this.chatService.mute(this.chat.name, user).subscribe((data) => {
			this.loading = false;

			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this.chat.mutes.push(user.id);
		});
	}

	unMute(user: I_User) {
		this.loading = true;

		this.chatService.unMute(this.chat.name, user).subscribe((data) => {
			this.loading = false;

			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this.chat.mutes = this.chat.mutes.filter((a) => a !== user.id);
		});
	}
}
