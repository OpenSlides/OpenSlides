import { Injectable } from '@angular/core';
import {
    HttpClient,
    HttpResponse,
    HttpErrorResponse,
    HttpHeaders
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, delay } from 'rxjs/operators';

import { User } from '../users/user';

const httpOptions = {
    withCredentials: true,
    headers: new HttpHeaders({
        'Content-Type': 'application/json'
    })
};

export interface LoginResponse {
    user_id: number;
    user: User;
}

export interface WhoAmIResponse extends LoginResponse {
    guest_enabled: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    isLoggedIn: boolean = false;

    // store the URL so we can redirect after logging in
    redirectUrl: string;

    constructor(private http: HttpClient) { }

    // Initialize the service by querying the server
    init(): Observable<WhoAmIResponse | {}> {
        return this.http.get<WhoAmIResponse>('users/whoami', httpOptions)
            .pipe(
                catchError(this.handleError())
            );
    }

    loginUser(user: User): Observable<LoginResponse | {}> {
        return this.http.post<LoginResponse>('users/login', user, httpOptions)
            .pipe(
                tap(val => {
                    console.log(val)
                }),
                catchError(this.handleError())
            );
    }

    //logout the user
    //TODO reboot openslides
    logout(): any {
        console.log("logout");
        // TODO Why isn't the request send??
        let t = this.http.post('users/logout', undefined, httpOptions);
        /*.pipe(
                tap(val => {
                    console.log(val)
                }),
                catchError(this.handleError())
            );*/
        console.log(t);
    }

    //very generic error handling function.
    //implicitly returns an observable that will display an error message
    private handleError<T>() {
        return (error: any): Observable<T> => {
            console.error(error);
            return of(error);
        }
    };
}
