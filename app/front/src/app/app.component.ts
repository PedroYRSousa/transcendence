import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

export interface I_Error {
	message?: string;
	error: string;
	status?: number;
	statusCode?: number;
	error_description?: string;
}

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, RouterOutlet],
	providers: [],
	templateUrl: './app.component.html',
})
export class AppComponent {}
