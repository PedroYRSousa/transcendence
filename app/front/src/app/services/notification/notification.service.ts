import { Injectable } from '@angular/core';
import { I_Error } from '../../app.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TokenService } from '../token/token.service';
import { EventsService } from '../events/events.service';
import { I_Chat, I_Content } from '../chat/chat.service';
import { RoutesService } from '../routes/routes.service';

@Injectable({
	providedIn: 'root',
})
export class NotificationService {
	constructor(private readonly _snackBar: MatSnackBar, private readonly tokenService: TokenService, private readonly routesService: RoutesService) {}

	show(chat: I_Chat, message: string) {
		this._snackBar
			.open(message, 'Abrir', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'bottom' })
			.onAction()
			.subscribe(() => {
				this.routesService.toChat();

				setTimeout(() => {
					EventsService.eventClickNotification.detail.chat = chat;
					dispatchEvent(EventsService.eventClickNotification);
				}, 500);
			});
	}
}
