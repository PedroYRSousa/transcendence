import { Observable, catchError, delay, of, switchMap } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { I_Error } from '../../app.component';

@Injectable({
	providedIn: 'root',
})
export class HttpService {
	lastTimeRequest: number = 0;
	constructor(private http: HttpClient) {}

	get(url: string, headers: HttpHeaders = new HttpHeaders()): Observable<Object | I_Error> {
		return this.http.get(url, { headers }).pipe(
			delay(500),
			catchError(({ error }: HttpErrorResponse) => of(error as I_Error)),
			switchMap((result) => {
				if (result === '429 Too Many Requests (Spam Rate Limit Exceeded)') return this.get(url, headers);
				else return of(result);
			}),
		);
	}

	post(url: string, headers: HttpHeaders = new HttpHeaders(), body: any = {}): Observable<Object | I_Error> {
		return this.http.post(url, body, { headers }).pipe(
			delay(500),
			catchError(({ error }: HttpErrorResponse) => of(error as I_Error)),
			switchMap((result) => {
				if (result === '429 Too Many Requests (Spam Rate Limit Exceeded)') return this.post(url, headers, body);
				else return of(result);
			}),
		);
	}

	patch(url: string, headers: HttpHeaders = new HttpHeaders(), body: any = {}): Observable<Object | I_Error> {
		return this.http.patch(url, body, { headers }).pipe(
			delay(500),
			catchError(({ error }: HttpErrorResponse) => of(error as I_Error)),
			switchMap((result) => {
				if (result === '429 Too Many Requests (Spam Rate Limit Exceeded)') return this.patch(url, headers, body);
				else return of(result);
			}),
		);
	}

	delete(url: string, headers: HttpHeaders = new HttpHeaders()): Observable<Object | I_Error> {
		return this.http.delete(url, { headers }).pipe(
			delay(500),
			catchError(({ error }: HttpErrorResponse) => of(error as I_Error)),
			switchMap((result) => {
				if (result === '429 Too Many Requests (Spam Rate Limit Exceeded)') return this.delete(url, headers);
				else return of(result);
			}),
		);
	}

	static checkIsError(data: object | I_Error) {
		return data && 'error' in data;
	}
}
