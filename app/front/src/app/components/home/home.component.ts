import { RouterOutlet } from '@angular/router';
import { AfterViewInit, Component, OnDestroy } from '@angular/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { I_Error } from '../../app.component';
import { HttpService } from '../../services/http/http.service';
import { ErrorService } from '../../services/error/error.service';
import { UsersComponent } from './components/users/users.component';
import { HeaderComponent } from './components/header/header.component';
import { I_User, UserService } from '../../services/user/user.service';
import { WebsocketService } from '../../services/websocket/websocket.service';
import { WSChat } from '../../services/websocket/chat';
import { RoutesService } from '../../services/routes/routes.service';

@Component({
	selector: 'app-home',
	standalone: true,
	imports: [HeaderComponent, UsersComponent, RouterOutlet, MatProgressSpinnerModule],
	templateUrl: './home.component.html',
	styleUrl: './home.component.scss',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
	public iam: I_User | null = null;

	constructor(private readonly errorService: ErrorService, private readonly userService: UserService, private readonly routersService: RoutesService) {}

	ngOnDestroy(): void {
		if (WebsocketService.socket) WebsocketService.socket.disconnect();
	}

	ngAfterViewInit(): void {
		addEventListener(WSChat.eventOpenGameView.type, (ev) => this.handleOpenGameView(ev as CustomEvent));

		this.userService.my().subscribe((data) => {
			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogout(data as I_Error);
				return;
			}

			this.iam = data as I_User;
			UserService.iam = this.iam;
		});
	}

	handleOpenGameView(ev: CustomEvent) {
		this.routersService.toGame();
	}
}
