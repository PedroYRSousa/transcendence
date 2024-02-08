import * as qrcode from 'qrcode';
import { Response } from 'express';
import { randomUUID } from 'crypto';
import { of, switchMap } from 'rxjs';
import * as speakeasy from 'speakeasy';
import { Controller, Get, Post, Body, Param, Res, Req, Query, HttpException } from '@nestjs/common';
import { BadRequestException, InternalServerErrorException, ForbiddenException, RequestTimeoutException, NotFoundException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { FileService } from 'src/services/file/file.service';
import { CacheService } from 'src/services/cache/cache.service';
import { RefreshBody } from 'src/BodyClasses/RefreshBody';
import { ActiveTwoFactorBody } from 'src/BodyClasses/ActiveTwoFactorBody';
import { ValidTwoFactorBody } from 'src/BodyClasses/ValidTwoFactorBody';
import { DeactivateTwoFactorBody } from 'src/BodyClasses/DeactivateTwoFactorBody';
import { Connection } from 'src/websocket/websocket.connection';
import { Room } from 'src/websocket/entities/room';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly fileService: FileService,
		private readonly authService: AuthService,
		private readonly usersService: UsersService,
		private readonly cacheService: CacheService,
	) {}

	@Get('my')
	async my(@Req() req: Request, @Res() res: Response) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		iam.friends = iam.friends.map((user) => {
			user['connected'] = false;
			user['inGame'] = false;

			for (const [_, map] of Connection.authConnections) {
				if (map.user.id === user.id) user['connected'] = true;

				const rooms = [...Room.privateRooms.rooms, ...Room.publicRooms.rooms];
				for (const room of rooms) if (room.game.player1.playerID === map.user.id || (room.game.player2 && room.game.player2.playerID === map.user.id)) user['inGame'] = true;
			}

			return user;
		});

		return res.send(iam);
	}

	@Get('login42')
	async login42(@Res() res: Response) {
		const { _42_PATH, _42_CLIENT, _42_REDIRECT_URI } = process.env;

		const url = `${_42_PATH}/oauth/authorize?client_id=${_42_CLIENT}&redirect_uri=${_42_REDIRECT_URI}&response_type=code`;

		res.status(302).redirect(url);
	}

	@Get('login')
	async login(@Query('code') code: string, @Res() res: Response) {
		if (!code) return res.status(302).redirect(process.env._ROUTE_LOGIN);

		res.cookie('error', null, { expires: new Date() });
		res.cookie('hashed_id', null, { expires: new Date() });
		res.cookie('token_type', null, { expires: new Date() });
		res.cookie('expires_in', null, { expires: new Date() });
		res.cookie('created_at', null, { expires: new Date() });
		res.cookie('access_token', null, { expires: new Date() });
		res.cookie('refresh_token', null, { expires: new Date() });
		res.cookie('get_two_factor', null, { expires: new Date() });
		res.cookie('secret_valid_until', null, { expires: new Date() });

		this.authService.digestCode(code).subscribe((digestedCode) => {
			if (digestedCode instanceof HttpException) {
				res.cookie('error', JSON.stringify(digestedCode.getResponse()));
				return res.status(302).redirect(process.env._ROUTE_LOGIN);
			}

			const { access_token, token_type, created_at, expires_in, refresh_token, secret_valid_until } = digestedCode;
			const token = `${token_type} ${access_token}`;

			this.authService.getUserInfoIn42(token).subscribe((user42) => {
				if (user42 instanceof HttpException) {
					res.cookie('error', JSON.stringify(user42.getResponse()));
					return res.status(302).redirect(process.env._ROUTE_LOGIN);
				}

				const { email, id, image, login: displayName } = user42;

				this.usersService
					.getByEmail(email)
					.pipe(switchMap((user) => (user instanceof HttpException ? this.usersService.create({ id, email, displayName, image: image.link }) : of(user))))
					.subscribe((user) => {
						if (user instanceof HttpException) {
							res.cookie('error', JSON.stringify(user.getResponse()));
							return res.status(302).redirect(process.env._ROUTE_LOGIN);
						}

						if (user.twoFactor) {
							const hashed_id = randomUUID();
							this.cacheService.set(hashed_id, { userID: user.id, access_token, token_type, created_at, expires_in, refresh_token, secret_valid_until }, 120);

							res.cookie('hashed_id', hashed_id);
							res.cookie('get_two_factor', 'true');
							res.status(302).redirect(process.env._ROUTE_LOGIN);
						} else {
							res.cookie('created_at', created_at);
							res.cookie('token_type', token_type);
							res.cookie('expires_in', expires_in);
							res.cookie('access_token', access_token);
							res.cookie('refresh_token', refresh_token);
							res.cookie('secret_valid_until', secret_valid_until);
							res.status(302).redirect(process.env._ROUTE_HOME);
						}
					});
			});
		});
	}

	@Post('refresh')
	async refresh(@Body() body: RefreshBody, @Res() res: Response, @Req() req: Request) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { refresh_token } = body;

		this.authService.refresh(refresh_token).subscribe((token) => {
			if (token instanceof HttpException) return res.status(token.getStatus()).send(token.getResponse());

			const { access_token, token_type, created_at, expires_in, refresh_token, secret_valid_until } = token;

			res.cookie('access_token', access_token);
			res.cookie('token_type', token_type);
			res.cookie('expires_in', expires_in);
			res.cookie('refresh_token', refresh_token);
			res.cookie('created_at', created_at);
			res.cookie('secret_valid_until', secret_valid_until);
			res.cookie('get_two_factor', null, { expires: new Date() });
			res.cookie('hashed_id', null, { expires: new Date() });
			res.send();
		});
	}

	@Get('logout')
	async logout(@Query('refresh_token') refresh_token: any, @Res() res: Response) {
		this.authService.refresh(refresh_token).subscribe(() => {
			res.cookie('access_token', null, { expires: new Date() });
			res.cookie('token_type', null, { expires: new Date() });
			res.cookie('expires_in', null, { expires: new Date() });
			res.cookie('refresh_token', null, { expires: new Date() });
			res.cookie('created_at', null, { expires: new Date() });
			res.cookie('secret_valid_until', null, { expires: new Date() });
			res.cookie('get_two_factor', null, { expires: new Date() });
			res.cookie('hashed_id', null, { expires: new Date() });

			res.status(302).redirect(process.env._ROUTE_LOGIN);
		});
	}

	@Post('generateTwoFactor')
	async generateTwoFactor(@Res() res: Response, @Req() req: Request) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const secret = speakeasy.generateSecret({ name: 'Transcendence' });
		const userSecret = secret.base32;
		const userURL = secret.otpauth_url;

		const name = randomUUID() + '.png';
		const buffer = await qrcode.toBuffer(userURL);
		this.fileService.saveFile(name, buffer, 30 * 1000);
		const pathQRCode = this.fileService.getPath(name);

		iam.twoFactor = false;
		iam.secret = userSecret;

		this.usersService.update(iam).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

			res.send({ pathQRCode });
		});
	}

	@Post('activeTwoFactor')
	async activeTwoFactor(@Body() body: ActiveTwoFactorBody, @Res() res: Response, @Req() req: Request) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { twoFactorCode } = body;

		if (!iam.secret) return res.status(400).send(new BadRequestException('Usuário não gerou o QRCode antes').getResponse());

		const isValid = speakeasy.totp.verify({
			secret: iam.secret,
			encoding: 'base32',
			token: twoFactorCode.toString(),
		});

		if (!isValid) return res.status(403).send(new ForbiddenException('Código de autenticação de dois fatores invalida').getResponse());

		iam.twoFactor = true;

		this.usersService.update(iam).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

			res.send();
		});
	}

	@Post('validTwoFactor')
	async validTwoFactor(@Body() body: ValidTwoFactorBody, @Res() res: Response, @Req() req: Request) {
		const { twoFactorCode, hashed_id } = body;

		if (!this.cacheService.get(hashed_id)) return res.status(408).send(new RequestTimeoutException('O tempo para validação dos 6 dígitos passou').getResponse());

		const { userID, access_token, token_type, created_at, expires_in, refresh_token, secret_valid_until } = this.cacheService.get(hashed_id) as any;

		this.usersService.get(userID).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());
			if (!user.secret || !user.twoFactor) return res.status(403).send(new ForbiddenException('Usuário não tem dois fatores ativado').getResponse());

			const isValid = speakeasy.totp.verify({
				secret: user.secret,
				encoding: 'base32',
				token: twoFactorCode.toString(),
			});

			if (!isValid) return res.status(403).send(new ForbiddenException('A autenticação de dois fatores falhou').getResponse());

			res.cookie('access_token', access_token);
			res.cookie('token_type', token_type);
			res.cookie('expires_in', expires_in);
			res.cookie('refresh_token', refresh_token);
			res.cookie('created_at', created_at);
			res.cookie('secret_valid_until', secret_valid_until);
			res.cookie('get_two_factor', null, { expires: new Date() });
			res.cookie('hashed_id', null, { expires: new Date() });
			res.status(200).send();
		});
	}

	@Post('deactivateTwoFactor')
	async deactivateTwoFactor(@Body() body: DeactivateTwoFactorBody, @Res() res: Response, @Req() req: Request) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		const { twoFactorCode } = body;

		if (!iam.secret || !iam.twoFactor) return res.status(403).send(new ForbiddenException('Usuário não tem dois fatores ativado').getResponse());

		const isValid = speakeasy.totp.verify({
			secret: iam.secret,
			encoding: 'base32',
			token: twoFactorCode.toString(),
		});

		if (!isValid) return res.status(403).send(new ForbiddenException('A autenticação de dois fatores falhou').getResponse());

		iam.secret = null;
		iam.twoFactor = false;

		this.usersService.update(iam).subscribe((user) => {
			if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

			res.send();
		});
	}

	@Post()
	async auth(@Body() body: { socketID: string }, @Res() res: Response, @Req() req: Request) {
		const iam = req['user'] as User;
		if (!iam) return res.status(403).send(new ForbiddenException('Usuário não autenticado').getResponse());

		if (!Connection.connections.has(body.socketID)) return;

		const conn = Connection.connections.get(body.socketID);
		Connection.addConnection(conn.client, iam);
	}
}
