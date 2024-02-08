import { RouterModule } from '@angular/router';
import { Component, Input, OnInit } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { I_Error } from '../../../../app.component';
import { HttpService } from '../../../../services/http/http.service';
import { ErrorService } from '../../../../services/error/error.service';
import { TokenService } from '../../../../services/token/token.service';
import { I_User, UserService } from '../../../../services/user/user.service';
import { ResumeProfileComponent } from '../resume-profile/resume-profile.component';

@Component({
	selector: 'app-header',
	standalone: true,
	imports: [MatButtonModule, MatIconModule, MatToolbarModule, MatProgressSpinnerModule, RouterModule, ResumeProfileComponent],
	templateUrl: './header.component.html',
	styleUrl: './header.component.scss',
})
export class HeaderComponent {
	constructor(private readonly userService: UserService, private readonly errorService: ErrorService, private readonly tokenService: TokenService) {}

	public get Iam() {
		return UserService.iam;
	}

	public getColor(name: string) {
		if (name === '/') {
			return !window.location.href.includes('friends') &&
				!window.location.href.includes('profile') &&
				!window.location.href.includes('chat') &&
				!window.location.href.includes('game')
				? 'warn'
				: 'accent';
		}

		return window.location.href.includes(name) ? 'warn' : 'accent';
	}

	public logout() {
		this.tokenService.logout();
	}
}
