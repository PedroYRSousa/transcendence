import { FormsModule } from '@angular/forms';
import { AfterViewInit, Component, Inject, Input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ListItemComponent } from '../list-item/list-item.component';
import { HttpService } from '../../../../../../../../services/http/http.service';
import { ErrorService } from '../../../../../../../../services/error/error.service';
import { ChatService, I_Chat } from '../../../../../../../../services/chat/chat.service';
import { I_User } from '../../../../../../../../services/user/user.service';

export interface I_DialogSearchChatData {
	iam: I_User;
}

@Component({
	selector: 'app-dialog-search-chat',
	standalone: true,
	imports: [MatProgressSpinnerModule, MatCardModule, MatButtonModule, MatIconModule, ListItemComponent, MatFormFieldModule, MatInputModule, FormsModule],
	templateUrl: './dialog-search-chat.component.html',
	styleUrl: './dialog-search-chat.component.scss',
})
export class DialogSearchChatComponent implements AfterViewInit {
	name: string = '';
	password: string = '';
	loading: boolean = false;
	chats: I_Chat[] | null = null;
	showPassword: boolean = false;
	selectedChat: I_Chat | null = null;

	constructor(
		@Inject(MAT_DIALOG_DATA) private readonly data: I_DialogSearchChatData,
		private readonly chatService: ChatService,
		private readonly errorService: ErrorService,
		public dialogRef: MatDialogRef<DialogSearchChatComponent>,
	) {}

	ngAfterViewInit(): void {
		this.chatService.listMyNotChats(this.data.iam.id).subscribe((chats) => {
			this.chats = chats as I_Chat[];
		});
	}

	selectChat(chat: I_Chat | null) {
		if (chat === this.selectedChat) chat = null;

		this.selectedChat = chat;
	}

	enter() {
		let name = '';
		const password = this.password;

		if (this.selectedChat) name = this.selectedChat.name;
		else name = this.name;

		this.loading = true;

		this.chatService.enter(name, password).subscribe((data) => {
			this.loading = false;

			if (HttpService.checkIsError(data)) this.dialogRef.close(data);
			else this.dialogRef.close(null);
		});
	}
}
