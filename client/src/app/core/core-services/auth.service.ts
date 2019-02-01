import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { OperatorService } from 'app/core/core-services/operator.service';
import { OpenSlidesComponent } from '../../openslides.component';
import { environment } from 'environments/environment';
import { User } from '../../shared/models/users/user';
import { OpenSlidesService } from './openslides.service';
import { HttpService } from './http.service';

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
     * @param http HttpService to send requests to the server
     * @param operator Who is using OpenSlides
     * @param OpenSlides The openslides service
     * @param router To navigate
     */
    public constructor(
        private http: HttpService,
        private operator: OperatorService,
        private OpenSlides: OpenSlidesService,
        private router: Router
    ) {
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
     * @returns The login response.
     */
    public async login(username: string, password: string): Promise<LoginResponse> {
        const user = {
            username: username,
            password: password
        };
        const response = await this.http.post<LoginResponse>(environment.urlPrefix + '/users/login/', user);
        this.operator.user = new User(response.user);
        return response;
    }

    /**
     * Logout function for both the client and the server.
     *
     * Will clear the current {@link OperatorService} and
     * send a `post`-request to `/apps/users/logout/'`
     */
    public async logout(): Promise<void> {
        this.operator.user = null;
        try {
            await this.http.post(environment.urlPrefix + '/users/logout/', {});
        } catch (e) {
            // We do nothing on failures. Reboot OpenSlides anyway.
        }
        this.router.navigate(['/']);
        this.OpenSlides.reboot();
    }
}
