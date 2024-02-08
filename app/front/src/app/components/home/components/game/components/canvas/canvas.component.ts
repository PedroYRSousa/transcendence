import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { WebsocketService } from '../../../../../../services/websocket/websocket.service';
import { WSGame } from '../../../../../../services/websocket/game';
import { Game, I_Game } from './entities/game';

@Component({
	selector: 'app-canvas',
	standalone: true,
	imports: [],
	templateUrl: './canvas.component.html',
	styleUrl: './canvas.component.scss',
})
export class CanvasComponent implements AfterViewInit, OnInit, OnDestroy {
	@Input({ required: true }) interfaceGame!: I_Game;
	@Input({ required: true }) public time: number | null = null;
	@Input({ required: true }) public paused: boolean = false;
	@Input({ required: true }) public showSpinner: boolean = true;
	@Input({ required: true }) public message: string | null = null;

	game!: Game;
	interval: any;

	@ViewChild('screen', { static: false }) canvas: ElementRef<HTMLCanvasElement> | undefined;
	context: any;

	constructor(private readonly wsService: WebsocketService) {}

	get Width() {
		return (this.game?.displayW ?? 400) + 'px';
	}

	get Height() {
		return (this.game?.displayH ?? 250) + 'px';
	}

	ngOnInit(): void {
		console.log('this.interfaceGame', this.interfaceGame);
		this.game = new Game(this.interfaceGame);
	}

	ngOnDestroy(): void {
		if (this.interval) clearInterval(this.interval);
	}

	ngAfterViewInit(): void {
		this.initializeCanvas();

		this.start();

		addEventListener(WSGame.eventUpdateGame.type, (ev) => this.handleUpdateGame(ev as CustomEvent));
		addEventListener(WSGame.eventPauseGame.type, (ev) => this.handlePauseGame(ev as CustomEvent));
		addEventListener(WSGame.eventResumeGame.type, (ev) => this.handleResumeGame(ev as CustomEvent));
	}

	handleKeyDown = (ev: KeyboardEvent) => {
		const key = ev.key.toLowerCase();

		const move = { roomID: this.game.roomID, direction: 'up' };

		if (key === 'w' || key === 'arrowup') {
			this.wsService.emitGame('move', move);
		} else if (key === 's' || key === 'arrowdown') {
			move.direction = 'down';
			this.wsService.emitGame('move', move);
		}
	};

	private start() {
		window.addEventListener('keydown', this.handleKeyDown);

		this.draw();
	}

	private handleUpdateGame(ev: CustomEvent) {
		console.log('handleUpdateGame', ev.detail);

		const { game } = ev.detail;
		if (!game) return;

		this.game.updateGame(game);
	}

	private handlePauseGame(ev: CustomEvent) {
		console.log('handlePauseGame', ev.detail);

		this.handleUpdateGame(ev);

		window.removeEventListener('keydown', this.handleKeyDown);
	}

	private handleResumeGame(ev: CustomEvent) {
		console.log('handlePauseGame', ev.detail);

		this.handleUpdateGame(ev);

		window.addEventListener('keydown', this.handleKeyDown);
	}

	private initializeCanvas() {
		const screen = this.canvas!.nativeElement;
		const context = screen!.getContext('2d');

		screen.width = this.game.displayW;
		screen.height = this.game.displayH;
		this.context = context;
	}

	private draw() {
		this.interval = setInterval(() => {
			this.context.clearRect(0, 0, this.game.displayW, this.game.displayH);

			if (!this.paused) {
				this.game.ball.move(this.game.frameRate);
				this.game.checkCollision();
			}

			// center line
			this.context.strokeStyle = 'white';
			this.context.beginPath();
			this.context.setLineDash([10, 10]);
			this.context.moveTo(400, 5);
			this.context.lineTo(400, 495);
			this.context.stroke();

			if (this.game.wall) this.game.wall.draw(this.context);

			this.game.ball.draw(this.context);
			this.game.player1.draw(this.context);
			this.game.player2.draw(this.context);
		}, this.game.frameRate);
	}
}
