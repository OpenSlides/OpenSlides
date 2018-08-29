import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { OperatorService } from 'app/core/services/operator.service';
import { OpenSlidesComponent } from '../../openslides.component';
import { environment } from 'environments/environment';
import { User } from '../../shared/models/users/user';
import { OpenSlidesService } from './openslides.service';

/**
 * The data returned by a post request to the login route.
 */
interface LoginResponse {
    user_id: number;
    user: User;
}

/**
 * Authenticates an OpenSlides user with username and password
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService extends OpenSlidesComponent {
    /**
     * Initializes the httpClient and the {@link OperatorService}.
     *
     * Calls `super()` from the parent class.
     * @param http HttpClient
     * @param operator who is using OpenSlides
     */
    constructor(private http: HttpClient, private operator: OperatorService, private OpenSlides: OpenSlidesService) {
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
    public login(username: string, password: string): Observable<LoginResponse> {
        const user = {
            username: username,
            password: password
        };
        return this.http.post<LoginResponse>(environment.urlPrefix + '/users/login/', user).pipe(
            tap((response: LoginResponse) => {
                this.operator.user = new User().deserialize(response.user);
            }),
            catchError(this.handleError())
        ) as Observable<LoginResponse>;
    }

    /**
     * Logout function for both the client and the server.
     *
     * Will clear the current {@link OperatorService} and
     * send a `post`-request to `/apps/users/logout/'`
     */
    public logout(): void {
        this.operator.user = null;
        this.http.post<any>(environment.urlPrefix + '/users/logout/', {}).subscribe(() => {
            this.OpenSlides.reboot();
        });
    }
}
