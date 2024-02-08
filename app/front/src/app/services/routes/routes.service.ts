import { Router } from '@angular/router';
import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class RoutesService {
	constructor(private readonly router: Router) {}

	public toHome() {
		this.router.navigate(['/home']);
	}

	public toGame() {
		this.router.navigate(['/game']);
	}

	public toChat() {
		this.router.navigate(['/chat']);
	}

	public toProfile(userId: number) {
		this.router.navigate([`/profile/${userId}`]);
	}

	public toMyProfile() {
		this.router.navigate(['/profile']);
	}

	public toLogin() {
		this.router.navigate(['/login']);
	}
}
