import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

import { Ball } from './components/canvas/entities/ball';
import { Player } from './components/canvas/entities/player';
import { WebsocketService } from '../../../../services/websocket/websocket.service';
import { ActivatedRoute } from '@angular/router';
import { I_Chat, I_Content } from '../../../../services/chat/chat.service';
import { NotificationService } from '../../../../services/notification/notification.service';
import { ErrorService } from '../../../../services/error/error.service';
import { MenuComponent } from './components/menu/menu.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { WSGame } from '../../../../services/websocket/game';
import { Game, I_Game } from './components/canvas/entities/game';
import { WSChat } from '../../../../services/websocket/chat';
import { UserService } from '../../../../services/user/user.service';

@Component({
	selector: 'app-game',
	standalone: true,
	imports: [MenuComponent, CanvasComponent],
	templateUrl: './game.component.html',
	styleUrl: './game.component.scss',
})
export class GameComponent implements AfterViewInit, OnDestroy {
	public time: number | null = null;
	public game: I_Game | null = null;
	public paused: boolean = false;
	public showSpinner: boolean = true;
	public message: string | null = null;
	public roomIDDisplay: string | null = null;
	public roomLinkDisplay: string | null = null;

	private playerNo = 0;

	@ViewChild('screen', { static: false }) canvas: ElementRef<HTMLCanvasElement> | undefined;
	context: any;

	public get Iam() {
		return UserService.iam;
	}

	constructor(
		private readonly route: ActivatedRoute,
		private readonly wsService: WebsocketService,
		private readonly notificationService: NotificationService,
		private readonly errorService: ErrorService,
	) {}

	handleNewMessage(ev: CustomEvent) {
		if (!window.location.href.includes('/game')) return;

		const { chat, content } = ev.detail as { chat: I_Chat; content: I_Content };

		if (content.author && this.Iam && this.Iam.blocks.find((b) => b.id === content.author?.id)) {
			return;
		}

		if (content.author) {
			const notification = `[${chat.name}] ${content.author.displayName}: ${content.text}`;

			this.notificationService.show(chat, notification);
		}
	}

	ngAfterViewInit(): void {
		addEventListener(WSChat.eventNewMessage.type, (ev) => this.handleNewMessage(ev as CustomEvent));
		addEventListener(WSGame.eventDisplayRoomID.type, (ev) => this.handleDisplayroomID(ev as CustomEvent));
		addEventListener(WSGame.eventPlayerNo.type, (ev) => this.handlePlayerNo(ev as CustomEvent));
		addEventListener(WSGame.eventStarting.type, (ev) => this.handleStarting(ev as CustomEvent));
		addEventListener(WSGame.eventTimeoutRoom.type, (ev) => this.handleTimeoutRoom(ev as CustomEvent));
		addEventListener(WSGame.eventStartedGame.type, (ev) => this.handleStartedGame(ev as CustomEvent));
		addEventListener(WSGame.eventUpdateGame.type, (ev) => this.handleUpdateGame(ev as CustomEvent));
		addEventListener(WSGame.eventPauseGame.type, (ev) => this.handlePauseGame(ev as CustomEvent));
		addEventListener(WSGame.eventResumeGame.type, (ev) => this.handleResumeGame(ev as CustomEvent));
		addEventListener(WSGame.eventWOGame.type, (ev) => this.handleWOGame(ev as CustomEvent));
		addEventListener(WSGame.eventEndGame.type, (ev) => this.handleEndGame(ev as CustomEvent));
		addEventListener(WSGame.eventRoomNotFound.type, (ev) => this.handleRoomNotFound(ev as CustomEvent));
		addEventListener(WSGame.eventRoomFull.type, (ev) => this.handleRoomFull(ev as CustomEvent));

		this.wsService.emitGame('resumeGame', {});

		this.route.params.subscribe((params) => {
			const { id } = params;
			if (!id) return;

			this.enterURL(id);
		});
	}

	ngOnDestroy(): void {
		if (this.game) this.wsService.emitGame('pauseGame', {});
	}

	public enterGame(roomID: string) {
		this.wsService.emitGame('enterGame', { roomID });
		this.message = 'Buscando Sala...';
		this.showSpinner = true;
	}

	public watchGame(roomID: string) {
		this.wsService.emitGame('watchGame', { roomID });
		this.message = 'Buscando Sala...';
		this.showSpinner = true;
	}

	public watchRandomGame() {
		this.wsService.emitGame('watchRandomGame', {});
		this.message = 'Buscando Sala...';
		this.showSpinner = true;
	}

	private handleDisplayroomID(ev: CustomEvent) {
		const { roomID, linkRoom } = ev.detail;

		if (roomID) {
			this.roomIDDisplay = `ID da sala: ${roomID}`;
			this.roomLinkDisplay = `Invite Link: ${linkRoom}`;
		}

		this.message = 'Aguardando outro jogador...';
		this.showSpinner = true;
	}

	private handlePlayerNo(ev: CustomEvent) {
		const { newPlayerNo } = ev.detail;
		if (!newPlayerNo) return;

		this.playerNo = newPlayerNo;
	}

	private handleStarting(ev: CustomEvent) {
		console.log('handleStarting', ev.detail);

		this.time = 3;
		this.roomIDDisplay = null;
		this.roomLinkDisplay = null;
		this.showSpinner = true;
		this.message = 'O jogo vai começar em instantes...';

		const interval = setInterval(() => {
			this.time! -= 1;
			if (this.time! <= 0) clearInterval(interval);
		}, 1000);
	}

	private handleTimeoutRoom(ev: CustomEvent) {
		console.log('handleTimeoutRoom', ev.detail);

		this.roomIDDisplay = null;
		this.roomLinkDisplay = null;
		this.message = 'O jogo foi cancelado devido a falta de jogadores.';
		this.showSpinner = false;

		setTimeout(() => {
			this.message = null;
		}, 2500);
	}

	private handleStartedGame(ev: CustomEvent) {
		console.log('handleStartedGame', ev.detail);

		const { game } = ev.detail;
		if (!game) return;

		this.game = game;
		this.message = null;
	}

	private handleUpdateGame(ev: CustomEvent) {
		console.log('handleUpdateGame', ev.detail);

		const { game } = ev.detail;
		if (!game) return;

		this.game = game;
		this.time = null;
		this.message = null;
	}

	private handlePauseGame(ev: CustomEvent) {
		console.log('handlePauseGame', ev.detail);

		const { game } = ev.detail;
		if (!game) return;

		this.time = 29;
		this.game = game;
		this.paused = true;
		this.message = 'Jogo pausado\nEsperando o jogador voltar...';

		const interval = setInterval(() => {
			this.time! -= 1;
			if (this.time! <= 0) {
				clearInterval(interval);
			}
		}, 1000);
	}

	private handleResumeGame(ev: CustomEvent) {
		console.log('handleResumeGame', ev.detail);

		const { game } = ev.detail;
		if (!game) return;

		this.time = null;
		this.game = game;
		this.paused = false;
		this.message = null;
	}

	private handleWOGame(ev: CustomEvent) {
		console.log('handleWOGame', ev.detail);

		const { game } = ev.detail;
		if (!game) return;

		this.time = 5;
		this.game = game;
		this.paused = true;
		this.message = 'Você venceu!\nO outro jogador não voltou\nVoltando para o menu...';
		this.wsService.emitGame('leave', { roomID: game.roomID });

		const interval = setInterval(() => {
			this.time! -= 1;
			if (this.time! <= 0) {
				clearInterval(interval);
				this.game = null;
				this.message = null;
				this.paused = false;
				this.time = null;
			}
		}, 1000);
	}

	private handleEndGame(ev: CustomEvent) {
		console.log('handleEndGame', ev.detail);

		const { game } = ev.detail;
		if (!game) return;

		this.time = 5;
		this.game = game;
		this.paused = true;
		this.message = `${game.winner === this.playerNo ? 'Você venceu!\nVoltando para o menu...' : 'Você perdeu!\nVoltando para o menu...'}`;
		this.wsService.emitGame('leave', { roomID: game.roomID });

		const interval = setInterval(() => {
			this.time! -= 1;
			if (this.time! <= 0) {
				clearInterval(interval);
				this.game = null;
				this.message = null;
				this.paused = false;
				this.time = null;
			}
		}, 1000);
	}

	private handleRoomNotFound(ev: CustomEvent) {
		console.log('handleRoomNotFound', ev.detail);

		this.message = null;
		this.errorService.handleErrorSnackBar({ error: 'Sala não encontrada' });
	}

	private handleRoomFull(ev: CustomEvent) {
		console.log('handleRoomFull', ev.detail);

		this.message = null;
		this.errorService.handleErrorSnackBar({ error: 'Sala esta cheia' });
	}

	private enterURL(roomID: any) {
		console.log(roomID);

		setTimeout(() => {
			this.wsService.emitGame('enterGame', { roomID });
			this.message = 'Buscando Sala...';
			this.showSpinner = true;
		}, 500);
	}
}
