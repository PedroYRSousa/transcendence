import { Component, EventEmitter, Input, Output } from '@angular/core';
import { I_Chat } from '../../../../../../../../../../services/chat/chat.service';
import { I_User } from '../../../../../../../../../../services/user/user.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
	selector: 'app-list-members',
	standalone: true,
	imports: [MatProgressSpinnerModule, MatButtonModule, MatIconModule],
	templateUrl: './list-members.component.html',
	styleUrl: './list-members.component.scss',
})
export class ListMembersComponent {
	@Input({ required: true }) public chat!: I_Chat;
	@Input({ required: true }) public iam!: I_User;
	@Input({ required: true }) public members!: I_User[];

	@Output() public addAdmin = new EventEmitter<I_User>();
	@Output() public removeAdmin = new EventEmitter<I_User>();
	@Output() public removeMember = new EventEmitter<I_User>();
	@Output() public kick = new EventEmitter<I_User>();
	@Output() public unKick = new EventEmitter<I_User>();
	@Output() public mute = new EventEmitter<I_User>();
	@Output() public unMute = new EventEmitter<I_User>();

	constructor() {}

	getStatus(user: I_User) {
		if (this.chat.owner === user.id) return 'dono';
		if (this.isKick(user)) return 'banido';
		if (this.isMuted(user)) return 'silenciado';
		if (this.isAdmin(user)) return 'administrador';

		return 'membro';
	}

	isOwner() {
		return this.chat.owner === this.iam.id;
	}

	isAdmin(user: I_User) {
		return this.chat.admins.includes(user.id);
	}

	isKick(user: I_User) {
		return this.chat.kicks.includes(user.id);
	}

	isMuted(user: I_User) {
		return this.chat.mutes.includes(user.id);
	}

	getDisabledAdminOptions(user: I_User) {
		if (this.isKick(user)) return true;

		return !this.isOwner();
	}

	getDisabledRemoveMember(user: I_User) {
		if (this.isKick(user)) return true;
		if (this.chat.owner === user.id) return true;

		if (this.isAdmin(user)) return !this.isOwner();
		else return !(this.isAdmin(this.iam) || this.isOwner());
	}

	getDisabledKickMember(user: I_User) {
		if (this.chat.owner === user.id) return true;

		if (this.isAdmin(user)) return !this.isOwner();
		else return !(this.isAdmin(this.iam) || this.isOwner());
	}

	getDisabledMuteMember(user: I_User) {
		if (this.isKick(user)) return true;
		if (this.chat.owner === user.id) return true;

		if (this.isAdmin(user)) return !this.isOwner();
		else return !(this.isAdmin(this.iam) || this.isOwner());
	}

	addRemoveAdmin(user: I_User) {
		const addAdmin = (user: I_User) => this.addAdmin.emit(user);
		const removeAdmin = (user: I_User) => this.removeAdmin.emit(user);

		if (this.isAdmin(user)) removeAdmin(user);
		else addAdmin(user);
	}

	removeUser(user: I_User) {
		this.removeMember.emit(user);
	}

	kickUnKickMember(user: I_User) {
		const kick = (user: I_User) => this.kick.emit(user);
		const unKick = (user: I_User) => this.unKick.emit(user);

		if (this.isKick(user)) unKick(user);
		else kick(user);
	}

	muteUnMuteMember(user: I_User) {
		const mute = (user: I_User) => this.mute.emit(user);
		const unMute = (user: I_User) => this.unMute.emit(user);

		if (this.isMuted(user)) unMute(user);
		else mute(user);
	}
}
