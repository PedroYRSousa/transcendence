import { catchError, of } from 'rxjs';
import { Request, Response } from 'express';
import { ForbiddenException, HttpException, Injectable, NestMiddleware } from '@nestjs/common';

import { UsersService } from 'src/controllers/users/users.service';
import { AuthService, T_DataUser42 } from 'src/controllers/auth/auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
	constructor(
		private authService: AuthService,
		private usersService: UsersService,
	) {}
	async use(req: Request, res: Response, next: () => void) {
		const token = req.headers.authorization as string;

		if (!token) return res.status(403).send(new ForbiddenException('Invalid token').getResponse());

		this.authService.getUserInfoIn42(token).subscribe((user42) => {
			if (user42 instanceof HttpException) return res.status(user42.getStatus()).send(user42.getResponse());

			const { email } = user42 as T_DataUser42;

			this.usersService.getByEmail(email).subscribe((user) => {
				if (user instanceof HttpException) return res.status(user.getStatus()).send(user.getResponse());

				req['user'] = user;
				next();
			});
		});
	}
}
