import { Component, Input } from '@angular/core';

import { ResumeProfileComponent } from '../../../../../../../resume-profile/resume-profile.component';
import { I_Content } from '../../../../../../../../../../services/chat/chat.service';
import { I_User, UserService } from '../../../../../../../../../../services/user/user.service';
import { RouterModule } from '@angular/router';
import { routes } from '../../../../../../../../../../app.routes';

@Component({
	selector: 'app-message',
	standalone: true,
	imports: [ResumeProfileComponent, RouterModule],
	templateUrl: './message.component.html',
	styleUrl: './message.component.scss',
})
export class MessageComponent {
	@Input({ required: true }) content!: I_Content;
	@Input({ required: true }) public iam!: I_User;

	public get Iam() {
		return UserService.iam;
	}

	get Text() {
		if (this.content.author && this.Iam && this.Iam.blocks.find((b) => b.id === this.content.author?.id)) return '-- User block --';
		return this.content.text;
	}

	isLink(text: string) {
		return text.includes('/game/');
	}
}
