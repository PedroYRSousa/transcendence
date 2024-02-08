import { BadRequestException, HttpException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChatDto } from './dto/chat.dto';
import { Observable, catchError, from, map, of, tap } from 'rxjs';
import { Chat } from './entities/chat.entity';
import { Like, Not, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatService {
	constructor(
		@Inject('CHAT_REPOSITORY') private chatDB: Repository<Chat>,
		private readonly logger: Logger = new Logger(ChatService.name),
	) {}

	create(createChatDto: ChatDto): Observable<Chat | HttpException> {
		return from(this.chatDB.save(createChatDto)).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chat) => {
				if (!chat) return new BadRequestException('Não foi possível criar chat');
				return chat as Chat;
			}),
		);
	}

	findAll(): Observable<Chat[] | HttpException> {
		return from(this.chatDB.find({ relations: { members: true }, where: { public: true, isDM: false } })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chats) => {
				if (!chats) return new BadRequestException('Não foi possível listar os chats');
				return chats as Chat[];
			}),
		);
	}
	findAllByUser(userId: number): Observable<Chat[] | HttpException> {
		return from(this.chatDB.find({ where: { members: { id: userId } }, relations: { members: true } })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chats) => {
				if (!chats) return new BadRequestException('Não foi possível listar os chats');
				return chats as Chat[];
			}),
		);
	}

	findOne(id: number): Observable<Chat | HttpException> {
		return from(this.chatDB.findOne({ where: { id }, relations: { contents: { author: true }, members: true } })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chat) => {
				if (!chat) return new NotFoundException('Chat não encontrado');
				return chat as Chat;
			}),
		);
	}
	findOneById(id: number): Observable<Chat | HttpException> {
		return from(this.chatDB.findOneBy({ id })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chat) => {
				if (!chat) return new NotFoundException('Chat não encontrado');
				return chat as Chat;
			}),
		);
	}
	findOneByName(name: string): Observable<Chat | HttpException> {
		return from(this.chatDB.findOneBy({ name })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chat) => {
				if (!chat) return new NotFoundException('Chat não encontrado');
				return chat as Chat;
			}),
		);
	}
	findOneByNameWithSecret(name: string): Observable<Chat | HttpException> {
		return from(
			this.chatDB.findOne({
				where: { name },
				select: {
					admins: true,
					createTimeStamp: true,
					id: true,
					kicks: true,
					mutes: true,
					name: true,
					owner: true,
					public: true,
					updateTimeStamp: true,
					protected: true,
					salt: true,
					password: true,
				},
				relations: {
					members: true,
				},
			}),
		).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chat) => {
				if (!chat) return new NotFoundException('Chat não encontrado');
				return chat as Chat;
			}),
		);
	}
	findOneByIdWithSecret(id: number): Observable<Chat | HttpException> {
		return from(
			this.chatDB.findOne({
				where: { id },
				select: {
					admins: true,
					createTimeStamp: true,
					id: true,
					kicks: true,
					mutes: true,
					name: true,
					owner: true,
					public: true,
					updateTimeStamp: true,
					protected: true,
					salt: true,
					password: true,
				},
				relations: {
					members: true,
				},
			}),
		).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chat) => {
				if (!chat) return new NotFoundException('Chat não encontrado');
				return chat as Chat;
			}),
		);
	}
	findOneDMByUsers(user1: User, user2: User): Observable<Chat | HttpException> {
		return from(this.chatDB.find({ relations: { members: true }, where: { isDM: true } })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chats: Chat[] | null) => {
				if (!chats) return new BadRequestException('Não foi possível listar as DM');

				const chat = chats.filter((c) => {
					const user1IsMember = c.members.filter((m) => m.id === user1.id).length > 0;
					const user2IsMember = c.members.filter((m) => m.id === user2.id).length > 0;

					return user1IsMember && user2IsMember;
				});

				if (chat.length <= 0) return new NotFoundException('Chat não encontrado');

				return chat[0];
			}),
		);
	}

	update(id: number, updateChatDto: ChatDto): Observable<null | HttpException> {
		return from(this.chatDB.update({ id }, updateChatDto)).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chat) => {
				if (!chat) return new BadRequestException('Não foi possível atualizar o chat');
				return null;
			}),
		);
	}
	updateStandAlone(chat: Chat): Observable<Chat | HttpException> {
		return from(this.chatDB.save(chat)).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chat) => {
				if (!chat) return new BadRequestException('Não foi possível atualizar o chat');
				return chat as Chat;
			}),
		);
	}

	remove(id: number): Observable<null | HttpException> {
		return from(this.chatDB.delete({ id })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chat) => {
				if (!chat) return new BadRequestException('Não foi possível apagar o chat');
				return null;
			}),
		);
	}
}
