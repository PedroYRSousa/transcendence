import * as fs from 'fs';
import { join } from 'path';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	ForbiddenException,
	Get,
	HttpException,
	NotFoundException,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Req,
	Res,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { ChatService } from '../chat/chat.service';
import { multerOptions } from 'src/middleware/multer/multer.middleware';
import { Connection } from 'src/websocket/websocket.connection';
import { Room } from 'src/websocket/entities/room';
import { GameService } from '../game/game.service';

@Controller('users')
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly chatService: ChatService,
		private readonly gameService: GameService,
	) {}

	@Get(':id')
	async get(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
		this.usersService.get(id).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

			res.send(user);
		});
	}

	@Get()
	async list(@Res() res: Response) {
		this.usersService.list().subscribe((users) => {
			if (users instanceof HttpException) return res.status(users.getStatus()).send(users.getResponse());

			users = users.map((user) => {
				user['connected'] = false;
				user['inGame'] = false;

				for (const [_, map] of Connection.authConnections) {
					if (map.user.id === user.id) user['connected'] = true;

					const rooms = [...Room.privateRooms.rooms, ...Room.publicRooms.rooms];
					for (const room of rooms) if (room.game.player1.playerID === map.user.id || (room.game.player2 && room.game.player2.playerID === map.user.id)) user['inGame'] = true;
				}

				return user;
			});

			res.send(users);
		});
	}

	@Patch()
	@UseInterceptors(FileInterceptor('file', multerOptions))
	async update(@UploadedFile() file: any, @Req() req: Request, @Body() body: any, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { displayName } = body;

		if (!displayName && !file) return res.status(400).send(new BadRequestException('Nenhum dado para alterar').getResponse());

		iam.displayName = displayName;

		this.usersService.getByDisplayName(iam.displayName).subscribe((_user) => {
			if (_user instanceof HttpException || _user.id === iam.id) {
				if (file) {
					if (iam.image && fs.existsSync(join(process.env.BACK_PATH, iam.image))) fs.rmSync(join(process.env.BACK_PATH, iam.image));
					iam.image = file.path;
				}
				iam.updateTimeStamp = new Date();

				this.usersService.update(iam).subscribe((err) => {
					if (err instanceof HttpException) return res.status(err.getStatus()).send(err.getResponse());

					res.send();
				});
			} else return res.status(409).send(new ConflictException('Já existe um usuário com esse nome').getResponse());
		});
	}

	@Post(':id/removeFriend')
	async removeFriend(@Param('id', ParseIntPipe) id: number, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());
		if (id === iam.id) return res.status(400).send(new BadRequestException('Não é possível realizar isso com você mesmo').getResponse());

		this.usersService.get(id).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

			iam.friends = iam.friends.filter((f) => f.id !== user.id);
			iam._friends = iam._friends.filter((f) => f.id !== user.id);
			user.friends = user.friends.filter((f) => f.id !== iam.id);
			user._friends = user._friends.filter((f) => f.id !== iam.id);

			this.usersService.update(iam).subscribe((err) => {
				if (err instanceof HttpException) return res.status(err.getStatus()).send(err.getResponse());

				this.usersService.update(user).subscribe((err) => {
					if (err instanceof HttpException) return res.status(err.getStatus()).send(err.getResponse());

					res.send();
				});
			});
		});
	}

	@Post(':id/addFriend')
	async addFriend(@Param('id', ParseIntPipe) id: number, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());
		if (id === iam.id) return res.status(400).send(new BadRequestException('Não é possível realizar isso com você mesmo').getResponse());

		this.usersService.get(id).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

			const isFriend = iam.friends.some((f) => f.id === user.id);
			if (isFriend) return res.status(400).send(new BadRequestException('O usuário em questão ja é seu amigo').getResponse());

			iam.friends.push(user);

			this.usersService.update(iam).subscribe((err) => {
				if (err instanceof HttpException) return res.status(err.getStatus()).send(err.getResponse());

				res.send();
			});
		});
	}

	@Post(':id/block')
	async block(@Param('id', ParseIntPipe) id: number, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());
		if (id === iam.id) return res.status(400).send(new BadRequestException('Não é possível realizar isso com você mesmo').getResponse());

		this.usersService.get(id).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

			const isBlocked = iam.blocks.some((b) => b.id === user.id);
			if (isBlocked) return res.status(400).send(new BadRequestException('O usuário ja esta bloqueado').getResponse());

			const isFriend = iam.friends.some((f) => f.id === user.id);
			if (isFriend) {
				iam.friends = iam.friends.filter((f) => f.id !== user.id);
				iam._friends = iam._friends.filter((f) => f.id !== user.id);
				user.friends = user.friends.filter((f) => f.id !== iam.id);
				user._friends = user._friends.filter((f) => f.id !== iam.id);
			}

			iam.blocks.push(user);

			this.usersService.update(iam).subscribe((err) => {
				if (err instanceof HttpException) return res.status(err.getStatus()).send(err.getResponse());

				this.usersService.update(user).subscribe((err) => {
					if (err instanceof HttpException) return res.status(err.getStatus()).send(err.getResponse());

					res.send();
				});
			});
		});
	}

	@Post(':id/unBlock')
	async unBlock(@Param('id', ParseIntPipe) id: number, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());
		if (id === iam.id) return res.status(400).send(new BadRequestException('Não é possível realizar isso com você mesmo').getResponse());

		this.usersService.get(id).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

			const isBlocked = iam.blocks.some((b) => b.id === user.id);
			if (!isBlocked) return res.status(400).send(new BadRequestException('O usuário não esta bloqueado').getResponse());

			iam.blocks = iam.blocks.filter((f) => f.id !== user.id);

			this.usersService.update(iam).subscribe((err) => {
				if (err instanceof HttpException) return res.status(err.getStatus()).send(err.getResponse());

				res.send();
			});
		});
	}

	@Get(':id/invites')
	async invites(@Param('id', ParseIntPipe) id: number, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		this.usersService.get(id).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

			this.usersService.invites(iam).subscribe((invites) => res.send(invites));
		});
	}

	@Get(':id/chat')
	async chats(@Param('id', ParseIntPipe) id: number, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		this.usersService.get(id).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

			this.chatService.findAllByUser(user.id).subscribe((chats) => {
				if (chats instanceof HttpException) return res.status(chats.getStatus()).send(chats.getResponse());

				res.send(chats);
			});
		});
	}

	@Get(':id/game')
	async games(@Param('id', ParseIntPipe) id: number, @Req() req: Request, @Res() res: Response) {
		this.usersService.get(id).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

			this.gameService.findAllByUser(user.id).subscribe((games) => {
				if (games instanceof HttpException) return res.status(games.getStatus()).send(games.getResponse());

				res.send(games);
			});
		});
	}

	@Get(':id/chat/not')
	async chatsNot(@Param('id', ParseIntPipe) id: number, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		this.usersService.get(id).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

			this.chatService.findAll().subscribe((chats) => {
				if (chats instanceof HttpException) return res.status(chats.getStatus()).send(chats.getResponse());

				res.send(chats.filter((c) => c.members.filter((m) => m.id === iam.id).length <= 0));
			});
		});
	}
}
