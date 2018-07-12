import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { OperatorService } from 'app/core/services/operator.service';
import { OpenSlidesComponent } from '../../openslides.component';

/**
 * Authenticates an OpenSlides user with username and password
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService extends OpenSlidesComponent {
    /**
     * if the user tries to access a certain URL without being authenticated, the URL will be stored here
     */
    redirectUrl: string;

    /**
     * Initializes the httpClient and the {@link OperatorService}.
     *
     * Calls `super()` from the parent class.
     * @param http HttpClient
     * @param operator who is using OpenSlides
     */
    constructor(private http: HttpClient, private operator: OperatorService) {
        super();
    }

    /**
     * Try to log in a user.
     *
     * Returns an observable 'user' with the correct login information or an error.
     * The user will then be stored in the {@link OperatorService},
     * errors will be forwarded to the parents error function.
     *
     * @param username
     * @param password
     */
    login(username: string, password: string): Observable<any> {
        const user: any = {
            username: username,
            password: password
        };
        return this.http.post<any>('/users/login/', user).pipe(
            tap(resp => this.operator.storeUser(resp.user)),
            catchError(this.handleError())
        );
    }

    /**
     * Logout function for both the client and the server.
     *
     * Will clear the current {@link OperatorService} and
     * send a `post`-requiest to `/users/logout/'`
     */
    //logout the user
    //TODO not yet used
    logout(): Observable<any> {
        this.operator.clear();
        return this.http.post<any>('/users/logout/', {});
    }
}
