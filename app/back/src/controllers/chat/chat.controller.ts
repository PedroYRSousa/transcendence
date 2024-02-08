import * as bcrypt from 'bcrypt';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';
import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	Req,
	Res,
	ForbiddenException,
	BadRequestException,
	ParseIntPipe,
	ConflictException,
	HttpException,
} from '@nestjs/common';

import { ChatDto } from './dto/chat.dto';
import { ChatService } from './chat.service';
import { Chat } from './entities/chat.entity';
import { User } from '../users/entities/user.entity';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { Connection } from 'src/websocket/websocket.connection';
import { Room } from 'src/websocket/entities/room';

@Controller('chat')
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Post()
	create(@Body() createChatDto: ChatDto, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		this.chatService.findOneByName(createChatDto.name).subscribe((chat) => {
			if (chat instanceof HttpException && chat.getStatus() !== HttpStatusCode.NotFound) return res.status(chat.getStatus()).send(chat.getResponse());
			if (!(chat instanceof HttpException)) return res.status(409).send(new ConflictException('Já existe um chat com esse nome').getResponse());

			createChatDto.owner = iam.id!;
			createChatDto.members = [iam];

			if (createChatDto.protected) {
				if (!createChatDto.password) return res.status(400).send(new BadRequestException('Não é possível ser protegido sem senha').getResponse());

				bcrypt.genSalt(Chat.SALTS_ROUNDS, (err, salt) => {
					bcrypt.hash(createChatDto.password, salt, (err, hash) => {
						createChatDto.password = hash;
						createChatDto.salt = salt;

						return this.chatService.create(createChatDto).subscribe((chat) => {
							if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

							res.status(201).send();
						});
					});
				});
			} else {
				createChatDto.password = null;
				createChatDto.salt = null;

				return this.chatService.create(createChatDto).subscribe((chat) => {
					if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

					res.status(201).send();
				});
			}
		});
	}

	@Post('dm')
	createDM(@Body() createDM: any, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { user } = createDM;
		const createChatDto: ChatDto = new ChatDto();

		this.chatService.findOneDMByUsers(iam, user).subscribe((dm) => {
			if (dm instanceof HttpException && dm.getStatus() !== HttpStatusCode.NotFound) return res.status(dm.getStatus()).send(dm.getResponse());
			if (dm && !(dm instanceof HttpException)) return res.status(409).send(new ConflictException('Já existe um DM entre os usuarios').getResponse());

			createChatDto.isDM = true;
			createChatDto.owner = null;
			createChatDto.public = false;
			createChatDto.protected = true;
			createChatDto.members = [iam, user];
			createChatDto.password = randomUUID();
			createChatDto.name = user.displayName + ' ' + iam.displayName;

			bcrypt.genSalt(Chat.SALTS_ROUNDS, (err, salt) => {
				bcrypt.hash(createChatDto.password, salt, (err, hash) => {
					createChatDto.password = hash;
					createChatDto.salt = salt;

					return this.chatService.create(createChatDto).subscribe((chat) => {
						if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

						res.status(201).send();
					});
				});
			});
		});
	}

	@Get()
	findAll(@Res() res: Response) {
		return this.chatService.findAll().subscribe((chats) => {
			if (chats instanceof HttpException) return res.status(chats.getStatus()).send(chats.getResponse());

			res.send(chats);
		});
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
		this.chatService.findOne(id).subscribe((chat) => {
			if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

			chat.contents = chat.contents.map((content) => {
				content.author['connected'] = false;
				content.author['inGame'] = false;

				for (const [_, map] of Connection.authConnections) {
					if (map.user.id === content.author.id) content.author['connected'] = true;

					const rooms = [...Room.privateRooms.rooms, ...Room.publicRooms.rooms];
					for (const room of rooms) if (room.game.player1.playerID === map.user.id || (room.game.player2 && room.game.player2.playerID === map.user.id)) content.author['inGame'] = true;
				}

				return content;
			});

			res.send(chat);
		});
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() updateChatDto: ChatDto, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		this.chatService.findOneById(id).subscribe((chat) => {
			if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());
			if (chat && chat.id !== id) return res.status(409).send(new ConflictException('Já existe um chat com esse nome').getResponse());
			if (chat.owner !== iam.id!) return res.status(403).send(new ForbiddenException('Somente o dono do chat pode performar isso').getResponse());

			if (updateChatDto.protected) {
				if (!updateChatDto.password) return res.status(400).send(new BadRequestException('Não é possível ser protegido sem senha').getResponse());

				bcrypt.genSalt(Chat.SALTS_ROUNDS, (err, salt) => {
					bcrypt.hash(updateChatDto.password, salt, (err, hash) => {
						updateChatDto.password = Buffer.from(hash, 'utf-8').toString('hex');
						updateChatDto.salt = Buffer.from(salt, 'utf-8').toString('hex');

						return this.chatService.update(id, updateChatDto).subscribe((err) => {
							if (err) return res.status(err.getStatus()).send(err.getResponse());

							res.send();
						});
					});
				});
			} else {
				updateChatDto.password = null;
				updateChatDto.salt = null;

				return this.chatService.update(id, updateChatDto).subscribe((err) => {
					if (err) return res.status(err.getStatus()).send(err.getResponse());

					res.send();
				});
			}
		});
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		this.chatService.findOne(id).subscribe((chat) => {
			if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

			if (chat.owner !== iam.id!) return res.status(403).send(new ForbiddenException('Somente o dono do chat pode performar isso').getResponse());
		});

		return this.chatService.remove(id).subscribe((err) => {
			if (err) return res.status(err.getStatus()).send(err.getResponse());

			res.send();
		});
	}
}

@Controller('action/chat')
export class ChatActionController {
	constructor(
		private readonly chatService: ChatService,
		private readonly usersService: UsersService,
	) {}

	@Get('dm/:id')
	findDM(@Param('id', ParseIntPipe) id: number, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		this.usersService.get(id).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

			this.chatService.findOneDMByUsers(iam, user).subscribe((dm) => {
				if (dm instanceof HttpException) return res.status(dm.getStatus()).send(dm.getResponse());

				res.send(dm);
			});
		});
	}

	@Post('enter')
	enter(@Body() body: any, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { name, password } = body;

		this.chatService.findOneByNameWithSecret(name).subscribe((chat) => {
			if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());
			if (chat.kicks.includes(iam.id!)) return res.status(403).send(new ForbiddenException('Usuário banido do chat').getResponse());
			if (chat.members.some((m) => m.id === iam.id)) return res.status(409).send(new ConflictException('Usuário ja esta no chat').getResponse());

			chat.members.push(iam);

			if (chat.protected) {
				bcrypt.compare(password, chat.password, (err, same) => {
					if (!same) return res.status(403).send(new ForbiddenException('Senha invalida').getResponse());

					this.chatService.updateStandAlone(chat).subscribe((chat) => {
						if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

						// Aqui a gente instiga o WS a enviar um comunicado
						res.send();
					});
				});
			} else
				this.chatService.updateStandAlone(chat).subscribe((chat) => {
					if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

					// Aqui a gente instiga o WS a enviar um comunicado
					res.send();
				});
		});
	}

	@Post('exit')
	exit(@Body() body: any, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { id } = body;

		this.chatService.findOneByIdWithSecret(id).subscribe((chat) => {
			if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());
			if (chat.members.filter((m) => m.id === iam.id).length <= 0) return res.status(400).send(new BadRequestException('Usuário não é membro do chat').getResponse());

			chat.members = chat.members.filter((m) => m.id !== iam.id);

			if (chat.members.length <= 0) {
				return this.chatService.remove(chat.id).subscribe((err) => {
					if (err) return res.status(err.getStatus()).send(err.getResponse());

					// Aqui a gente instiga o WS a enviar um comunicado
					res.send();
				});
			}

			if (chat.owner === iam.id) {
				if (chat.admins.length > 0) chat.owner = chat.admins[0];
				else chat.owner = chat.members[0].id;
			}

			this.chatService.updateStandAlone(chat).subscribe((chat) => {
				if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

				// Aqui a gente instiga o WS a enviar um comunicado
				res.send();
			});
		});
	}

	@Post('addAdmin')
	addAdmin(@Body() body: any, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { user, name } = body;

		this.chatService.findOneByNameWithSecret(name).subscribe((chat) => {
			if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());
			if (chat.owner !== iam.id) return res.status(403).send(new ForbiddenException('Usuário não tem autorização').getResponse());
			if (chat.kicks.includes(user.id)) return res.status(403).send(new ForbiddenException('Usuário banido do chat').getResponse());
			if (chat.admins.includes(user.id)) return res.status(409).send(new ConflictException('Usuário ja é administrador').getResponse());
			if (chat.members.filter((m) => m.id === user.id).length <= 0) return res.status(400).send(new BadRequestException('Usuário não é membro do chat').getResponse());

			chat.admins.push(user.id);

			this.chatService.updateStandAlone(chat).subscribe((chat) => {
				if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

				// Aqui a gente instiga o WS a enviar um comunicado
				res.send();
			});
		});
	}

	@Post('removeAdmin')
	removeAdmin(@Body() body: any, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { user, name } = body;

		this.chatService.findOneByNameWithSecret(name).subscribe((chat) => {
			if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());
			if (chat.owner !== iam.id) return res.status(403).send(new ForbiddenException('Usuário não tem autorização').getResponse());
			if (!chat.admins.includes(user.id)) return res.status(409).send(new ConflictException('Usuário não é administrador').getResponse());
			if (chat.members.filter((m) => m.id === user.id).length <= 0) return res.status(400).send(new BadRequestException('Usuário não é membro do chat').getResponse());

			chat.admins = chat.admins.filter((a) => a !== user.id);

			this.chatService.updateStandAlone(chat).subscribe((chat) => {
				if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

				// Aqui a gente instiga o WS a enviar um comunicado
				res.send();
			});
		});
	}

	@Post('removeMember')
	removeMember(@Body() body: any, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { user, name } = body;

		this.chatService.findOneByNameWithSecret(name).subscribe((chat) => {
			if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());
			if (user.id === chat.owner) return res.status(403).send(new ForbiddenException('Não é possível remover o dono do chat').getResponse());
			if (chat.owner !== iam.id && !chat.admins.includes(iam.id)) return res.status(403).send(new ForbiddenException('Usuário não tem autorização').getResponse());
			if (chat.admins.includes(iam.id) && chat.admins.includes(user.id)) return res.status(403).send(new ForbiddenException('Usuário não tem autorização').getResponse());
			if (chat.members.filter((m) => m.id === user.id).length <= 0) return res.status(400).send(new BadRequestException('Usuário não é membro do chat').getResponse());

			chat.members = chat.members.filter((m) => m.id !== user.id);

			this.chatService.updateStandAlone(chat).subscribe((chat) => {
				if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

				// Aqui a gente instiga o WS a enviar um comunicado
				res.send();
			});
		});
	}

	@Post('kick')
	kick(@Body() body: any, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { user, name } = body;

		this.chatService.findOneByNameWithSecret(name).subscribe((chat) => {
			if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());
			if (user.id === chat.owner) return res.status(403).send(new ForbiddenException('Não é possível remover o dono do chat').getResponse());
			if (chat.owner !== iam.id && !chat.admins.includes(iam.id)) return res.status(403).send(new ForbiddenException('Usuário não tem autorização').getResponse());
			if (chat.admins.includes(iam.id) && chat.admins.includes(user.id)) return res.status(403).send(new ForbiddenException('Usuário não tem autorização').getResponse());
			if (chat.members.filter((m) => m.id === user.id).length <= 0) return res.status(400).send(new BadRequestException('Usuário não é membro do chat').getResponse());

			chat.members = chat.members.filter((m) => m.id !== user.id);
			chat.kicks.push(user.id);

			this.chatService.updateStandAlone(chat).subscribe((chat) => {
				if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

				// Aqui a gente instiga o WS a enviar um comunicado
				res.send();
			});
		});
	}

	@Post('unKick')
	unKick(@Body() body: any, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { user, name } = body;

		this.chatService.findOneByNameWithSecret(name).subscribe((chat) => {
			if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());
			if (user.id === chat.owner) return res.status(403).send(new ForbiddenException('Não é possível remover o dono do chat').getResponse());
			if (chat.owner !== iam.id && !chat.admins.includes(iam.id)) return res.status(403).send(new ForbiddenException('Usuário não tem autorização').getResponse());
			if (chat.admins.includes(iam.id) && chat.admins.includes(user.id)) return res.status(403).send(new ForbiddenException('Usuário não tem autorização').getResponse());
			if (!chat.kicks.includes(user.id)) return res.status(400).send(new BadRequestException('Usuário não foi banido').getResponse());

			chat.kicks = chat.kicks.filter((k) => k !== user.id);

			this.chatService.updateStandAlone(chat).subscribe((chat) => {
				if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

				// Aqui a gente instiga o WS a enviar um comunicado
				res.send();
			});
		});
	}

	@Post('mute')
	mute(@Body() body: any, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { user, name } = body;

		this.chatService.findOneByNameWithSecret(name).subscribe((chat) => {
			if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());
			if (user.id === chat.owner) return res.status(403).send(new ForbiddenException('Não é possível silenciar o dono do chat').getResponse());
			if (chat.owner !== iam.id && !chat.admins.includes(iam.id)) return res.status(403).send(new ForbiddenException('Usuário não tem autorização').getResponse());
			if (chat.admins.includes(iam.id) && chat.admins.includes(user.id)) return res.status(403).send(new ForbiddenException('Usuário não tem autorização').getResponse());
			if (chat.members.filter((m) => m.id === user.id).length <= 0) return res.status(400).send(new BadRequestException('Usuário não é membro do chat').getResponse());

			chat.mutes.push(user.id);

			// Depois de 30 segundos a condição sai
			setTimeout(() => {
				chat.mutes = chat.mutes.filter((k) => k !== user.id);
				// Aqui a gente instiga o WS a enviar um comunicado

				this.chatService.updateStandAlone(chat).subscribe(() => {
					// Aqui a gente instiga o WS a enviar um comunicado
				});
			}, 30 * 1000);

			this.chatService.updateStandAlone(chat).subscribe((chat) => {
				if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

				// Aqui a gente instiga o WS a enviar um comunicado
				res.send();
			});
		});
	}

	@Post('unMute')
	unMute(@Body() body: any, @Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { user, name } = body;

		this.chatService.findOneByNameWithSecret(name).subscribe((chat) => {
			if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());
			if (user.id === chat.owner) return res.status(403).send(new ForbiddenException('Não é possível silenciar o dono do chat').getResponse());
			if (chat.owner !== iam.id && !chat.admins.includes(iam.id)) return res.status(403).send(new ForbiddenException('Usuário não tem autorização').getResponse());
			if (chat.admins.includes(iam.id) && chat.admins.includes(user.id)) return res.status(403).send(new ForbiddenException('Usuário não tem autorização').getResponse());
			if (chat.members.filter((m) => m.id === user.id).length <= 0) return res.status(400).send(new BadRequestException('Usuário não é membro do chat').getResponse());
			if (!chat.mutes.includes(user.id)) return res.status(400).send(new BadRequestException('Usuário não foi silenciado').getResponse());

			chat.mutes = chat.mutes.filter((k) => k !== user.id);

			this.chatService.updateStandAlone(chat).subscribe((chat) => {
				if (chat instanceof HttpException) return res.status(chat.getStatus()).send(chat.getResponse());

				// Aqui a gente instiga o WS a enviar um comunicado
				res.send();
			});
		});
	}
}
