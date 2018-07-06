import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { OperatorService } from 'app/core/services/operator.service';

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
    redirectUrl: string;

    constructor(private http: HttpClient, private operator: OperatorService) {}

    //loggins a users. expects a user model
    login(username: string, password: string): Observable<any> {
        const user: any = {
            username: username,
            password: password
        };
        return this.http.post<any>('/users/login/', user, httpOptions).pipe(
            tap(resp => this.operator.storeUser(resp.user)),
            catchError(this.handleError())
        );
    }

    //logout the user
    //TODO not yet used
    logout(): Observable<any> {
        this.operator.clear();
        return this.http.post<any>('/users/logout/', {}, httpOptions);
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
