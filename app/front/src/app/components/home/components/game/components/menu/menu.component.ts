import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { WebsocketService } from '../../../../../../services/websocket/websocket.service';

export type T_Menu = 'main' | 'play' | 'enterPlay' | 'enterWatch' | 'watch' | 'mm' | 'createGame';

@Component({
	selector: 'app-menu',
	standalone: true,
	imports: [FormsModule, MatIconModule, MatButtonModule, MatInputModule, MatFormFieldModule],
	templateUrl: './menu.component.html',
	styleUrl: './menu.component.scss',
})
export class MenuComponent {
	public menu: T_Menu = 'main';
	public inputRoomID: string | null = null;
	@Input({ required: true }) public time: number | null = null;
	@Input({ required: true }) public showSpinner: boolean = true;
	@Input({ required: true }) public message: string | null = null;
	@Input({ required: true }) public roomIDDisplay: string | null = null;
	@Input({ required: true }) public roomLinkDisplay: string | null = null;

	@Output() public handleEnterGame = new EventEmitter<string>();
	@Output() public handleWatchGame = new EventEmitter<string>();
	@Output() public handleWatchRandomGame = new EventEmitter<string>();

	constructor(private readonly wsService: WebsocketService) {}

	public toPlayMenu() {
		this.menu = 'play';
	}

	public toWatchMenu() {
		this.menu = 'watch';
	}

	public toMainMenu() {
		this.menu = 'main';
	}

	public toEnterMenu(play: boolean) {
		if (play) this.menu = 'enterPlay';
		else this.menu = 'enterWatch';
	}

	public toMMMenu() {
		this.menu = 'mm';
	}

	public toCreateGameMenu() {
		this.menu = 'createGame';
	}

	public createGame(alternative: boolean, publicRoom: boolean) {
		this.wsService.emitGame('createGame', { alternative, publicRoom });
	}

	public watchRandomGame() {
		this.handleWatchRandomGame.emit();
	}

	public enterGame(play: boolean) {
		if (play) this.handleEnterGame.emit(this.inputRoomID ?? '');
		else this.handleWatchGame.emit(this.inputRoomID ?? '');
	}
}
