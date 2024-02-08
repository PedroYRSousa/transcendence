import { Component, EventEmitter, Input, Output } from '@angular/core';
import { I_Chat } from '../../../../../../../../services/chat/chat.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { I_User } from '../../../../../../../../services/user/user.service';

@Component({
	selector: 'app-list-item',
	standalone: true,
	imports: [MatIconModule, MatButtonModule],
	templateUrl: './list-item.component.html',
	styleUrl: './list-item.component.scss',
})
export class ListItemComponent {
	@Input() showProtected: boolean = false;
	@Input({ required: true }) chat!: I_Chat;
	@Output() selectChat = new EventEmitter();

	get Name() {
		return this.chat.name.length > 15 ? this.chat.name.slice(0, 12).concat('...') : this.chat.name;
	}

	getIcon() {
		if (!this.showProtected) return this.chat.public ? 'public' : 'public_off';

		return this.chat.protected ? 'lock' : 'unlock';
	}
}
