import { Socket, io } from 'socket.io-client';
import { TokenService } from '../token/token.service';
import { ErrorService } from '../error/error.service';
import { I_Error } from '../../app.component';
import { I_Game } from '../../components/home/components/game/components/canvas/entities/game';

export class WSGame {
	public static readonly eventDisplayRoomID = new CustomEvent('onDisplayRoomId', { detail: { roomID: null as any, linkRoom: null as any } });
	public static readonly eventPlayerNo = new CustomEvent('onPlayerNo', { detail: { newPlayerNo: null as any } });
	public static readonly eventTimeoutRoom = new CustomEvent('onTimeoutRoom', { detail: {} });
	public static readonly eventStarting = new CustomEvent('onStartingGame', { detail: {} });
	public static readonly eventStartedGame = new CustomEvent('onStartedGame', { detail: { game: null as I_Game | null } });
	public static readonly eventUpdateGame = new CustomEvent('onUpdateGame', { detail: { game: null as I_Game | null } });
	public static readonly eventPauseGame = new CustomEvent('onPauseGame', { detail: { game: null as I_Game | null } });
	public static readonly eventResumeGame = new CustomEvent('onResumeGame', { detail: { game: null as I_Game | null } });
	public static readonly eventWOGame = new CustomEvent('onWOGame', { detail: { game: null as I_Game | null } });
	public static readonly eventEndGame = new CustomEvent('onEndGame', { detail: { game: null as I_Game | null } });
	public static readonly eventRoomNotFound = new CustomEvent('onRoomNotFound', { detail: {} });
	public static readonly eventRoomFull = new CustomEvent('onRoomFull', { detail: {} });

	constructor(private readonly errorService: ErrorService) {}

	public error(data: I_Error) {
		console.log('error');

		this.errorService.handleErrorSnackBar(data);
	}

	public displayRoomID(data: any) {
		console.log('displayRoomID');

		if (!data) {
			dispatchEvent(WSGame.eventDisplayRoomID);
			return;
		}
		const { roomID, linkRoom } = data;

		WSGame.eventDisplayRoomID.detail.roomID = roomID;
		WSGame.eventDisplayRoomID.detail.linkRoom = linkRoom;
		dispatchEvent(WSGame.eventDisplayRoomID);
	}

	public playerNo(newPlayerNo: any) {
		console.log('playerNo');

		WSGame.eventPlayerNo.detail.newPlayerNo = newPlayerNo;
		dispatchEvent(WSGame.eventPlayerNo);
	}

	public timeoutRoom() {
		console.log('timeoutRoom');

		dispatchEvent(WSGame.eventTimeoutRoom);
	}

	public startingGame() {
		console.log('startingGame');

		dispatchEvent(WSGame.eventStarting);
	}

	public startedGame(game: I_Game) {
		console.log('startedGame');

		WSGame.eventStartedGame.detail.game = game;
		dispatchEvent(WSGame.eventStartedGame);
	}

	public updateGame(game: I_Game) {
		console.log('updateGame');

		WSGame.eventUpdateGame.detail.game = game;
		dispatchEvent(WSGame.eventUpdateGame);
	}

	public pauseGame(game: I_Game) {
		console.log('pauseGame');

		WSGame.eventPauseGame.detail.game = game;
		dispatchEvent(WSGame.eventPauseGame);
	}

	public resumeGame(game: I_Game) {
		console.log('resumeGame');

		WSGame.eventResumeGame.detail.game = game;
		dispatchEvent(WSGame.eventResumeGame);
	}

	public WOGame(game: I_Game) {
		console.log('WOGame');

		WSGame.eventWOGame.detail.game = game;
		dispatchEvent(WSGame.eventWOGame);
	}

	public endGame(game: I_Game) {
		console.log('endGame');

		WSGame.eventEndGame.detail.game = game;
		dispatchEvent(WSGame.eventEndGame);
	}

	public roomNotFound() {
		console.log('roomNotFound');

		dispatchEvent(WSGame.eventRoomNotFound);
	}

	public roomFull() {
		console.log('roomFull');

		dispatchEvent(WSGame.eventRoomFull);
	}
}
