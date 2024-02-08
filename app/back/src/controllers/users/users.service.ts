import { Repository } from 'typeorm';
import { Observable, catchError, from, map, of } from 'rxjs';
import { BadRequestException, HttpException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { User } from './entities/user.entity';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
	constructor(
		@Inject('USER_REPOSITORY') private userDB: Repository<User>,
		private readonly logger: Logger = new Logger(UsersService.name),
	) {}

	get(id: number): Observable<User | HttpException> {
		return from(this.userDB.findOne({ where: { id }, relations: { blocks: true, friends: true, _friends: true } })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((user) => {
				if (!user) return new NotFoundException('Usuário não encontrado');
				return user;
			}),
		);
	}
	getByDisplayName(displayName: string): Observable<User | HttpException> {
		return from(this.userDB.findOne({ where: { displayName }, relations: { blocks: true, friends: true, _friends: true } })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((user) => {
				if (!user) return new NotFoundException('Usuário não encontrado');
				return user;
			}),
		);
	}
	getByEmail(email: string): Observable<User | HttpException> {
		return from(this.userDB.findOne({ where: { email }, relations: { blocks: true, friends: true, _friends: true } })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((user) => {
				if (!user) return new NotFoundException('Usuário não encontrado');
				return user;
			}),
		);
	}

	list(): Observable<User[]> {
		return from(this.userDB.find({ relations: { blocks: true, friends: true, _friends: true }, order: { scoreGeral: 'DESC' } })).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((users) => {
				if (!users) return [];

				users = users.map((u, i) => {
					u['ranking'] = i + 1;
					return u;
				});

				return users;
			}),
		);
	}

	create(createUserDto: UserDto): Observable<User | HttpException> {
		return from(this.userDB.save(createUserDto)).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((user) => {
				if (!user) return new BadRequestException('Não foi possível cadastrar usuário');
				return user as User;
			}),
		);
	}

	update(user: User): Observable<null | HttpException> {
		return from(this.userDB.save(user)).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((user) => {
				if (!user) return new BadRequestException('Não foi possível atualizar o usuário');
				return null;
			}),
		);
	}
	updateScoreGeral(user: User, scoreGeral: number): Observable<null | HttpException> {
		user.scoreGeral = scoreGeral;

		return from(this.userDB.save(user)).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((user) => {
				if (!user) return new BadRequestException('Não foi possível atualizar o usuário');
				return null;
			}),
		);
	}

	invites(user: User) {
		const { friends, _friends } = user;

		const invites = _friends.filter((f1) => !friends.some((f2) => f2.id === f1.id));

		return of(invites);
	}
}
