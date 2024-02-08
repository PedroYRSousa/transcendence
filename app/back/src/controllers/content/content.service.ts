import { BadRequestException, HttpException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Observable, catchError, from, map, of } from 'rxjs';
import { Repository } from 'typeorm';

import { Content } from './entities/content.entity';
import { CreateContentDto } from './dto/create-content.dto';

@Injectable()
export class ContentService {
	constructor(
		@Inject('CONTENT_REPOSITORY') private contentDB: Repository<Content>,
		private readonly logger: Logger = new Logger(ContentService.name),
	) {}

	create(createContentDto: CreateContentDto): Observable<Content | HttpException> {
		return from(this.contentDB.save(createContentDto)).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((content) => {
				if (!content) return new BadRequestException('Não foi possível salvar a mensagem');
				return content as Content;
			}),
		);
	}

	findAll(): Observable<Content[] | HttpException> {
		return from(this.contentDB.find({ relations: { author: true, chat: true } })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chats) => {
				if (!chats) return new BadRequestException('Não foi possível listar os contents');
				return chats as Content[];
			}),
		);
	}
	findAllByUser(userId: number): Observable<Content[] | HttpException> {
		return from(this.contentDB.find({ where: { author: { id: userId } }, relations: { chat: true } })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chats) => {
				if (!chats) return new BadRequestException('Não foi possível listar os contents');
				return chats as Content[];
			}),
		);
	}
	findAllByChat(chatId: number): Observable<Content[] | HttpException> {
		return from(this.contentDB.find({ where: { chat: { id: chatId } }, relations: { author: true } })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chats) => {
				if (!chats) return new BadRequestException('Não foi possível listar os contents');
				return chats as Content[];
			}),
		);
	}

	findOne(id: number): Observable<Content | HttpException> {
		return from(this.contentDB.findOne({ where: { id }, relations: { author: true, chat: true } })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chat) => {
				if (!chat) return new NotFoundException('Content não encontrado');
				return chat as Content;
			}),
		);
	}

	remove(id: number): Observable<null | HttpException> {
		return from(this.contentDB.delete({ id })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((chat) => {
				if (!chat) return new BadRequestException('Não foi possível apagar o Content');
				return null;
			}),
		);
	}
}
