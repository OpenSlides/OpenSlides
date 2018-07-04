import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { User } from 'app/core/models/users/user';

const httpOptions = {
    withCredentials: true,
    headers: new HttpHeaders({
        'Content-Type': 'application/json'
    })
};

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    isLoggedIn: boolean;

    // store the URL so we can redirect after logging in
    redirectUrl: string;

    constructor(private http: HttpClient) {
        //check for the cookie in local storrage
        //TODO checks for username now since django does not seem to return a cookie
        if (localStorage.getItem('username')) {
            this.isLoggedIn = true;
        } else {
            this.isLoggedIn = false;
        }
    }

    // Initialize the service by querying the server
    // Not sure if this makes sense, since a service is not supposed to init()
    init(): Observable<User | any> {
        return this.http.get<User>('/users/whoami/', httpOptions).pipe(
            tap(val => {
                console.log('auth-init-whami : ', val);
            }),
            catchError(this.handleError())
        );
    }

    //loggins a users. expects a user model
    login(username: string, password: string): Observable<User | any> {
        const user: any = {
            username: username,
            password: password
        };
        return this.http.post<any>('/users/login/', user, httpOptions).pipe(
            tap(val => {
                localStorage.setItem('username', val.username);
                this.isLoggedIn = true;
            }),
            catchError(this.handleError())
        );
    }

    //logout the user
    //TODO not yet used
    logout(): Observable<User | any> {
        this.isLoggedIn = false;
        localStorage.removeItem('username');

        return this.http.post<User>('/users/logout/', {}, httpOptions);
    }

    //very generic error handling function.
    //implicitly returns an observable that will display an error message
    private handleError<T>() {
        return (error: any): Observable<T> => {
            console.error(error);
            return of(error);
        };
    }
}
