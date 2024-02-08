import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { GameComponent } from './components/home/components/game/game.component';
import { ChatComponent } from './components/home/components/chat/chat.component';
import { UsersComponent } from './components/home/components/users/users.component';
import { ProfileComponent } from './components/home/components/profile/profile.component';
import { MyProfileComponent } from './components/home/components/my-profile/my-profile.component';
import { FriendsComponent } from './components/home/components/friends/friends.component';
import { AuthGuardService } from './services/AuthGuardService/auth-guard-service.service';

export const routes: Routes = [
	{
		path: 'login',
		component: LoginComponent,
		canMatch: [AuthGuardService],
	},
	{
		path: '',
		component: HomeComponent,
		canActivate: [AuthGuardService],
		canActivateChild: [AuthGuardService],
		children: [
			{
				path: '',
				component: UsersComponent,
			},
			{
				path: 'game',
				component: GameComponent,
			},
			{
				path: 'game/:id',
				component: GameComponent,
			},
			{
				path: 'chat',
				component: ChatComponent,
			},
			{
				path: 'friends',
				component: FriendsComponent,
			},
			{
				path: 'profile/:id',
				component: ProfileComponent,
			},
			{
				path: 'profile',
				component: MyProfileComponent,
			},
		],
	},
	{
		path: '**',
		redirectTo: '/',
	},
];
