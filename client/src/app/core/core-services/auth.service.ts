import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { OperatorService, WhoAmI } from 'app/core/core-services/operator.service';
import { environment } from 'environments/environment';
import { OpenSlidesService } from './openslides.service';
import { HttpService } from './http.service';
import { DataStoreService } from './data-store.service';

/**
 * Authenticates an OpenSlides user with username and password
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    /**
     * Initializes the httpClient and the {@link OperatorService}.
     *
     * @param http HttpService to send requests to the server
     * @param operator Who is using OpenSlides
     * @param OpenSlides The openslides service
     * @param router To navigate
     */
    public constructor(
        private http: HttpService,
        private operator: OperatorService,
        private OpenSlides: OpenSlidesService,
        private router: Router,
        private DS: DataStoreService
    ) {}

    /**
     * Try to log in a user.
     *
     * Returns an observable with the correct login information or an error.
     * errors will be forwarded to the parents error function.
     *
     * @param username
     * @param password
     * @returns The login response.
     */
    public async login(username: string, password: string, earlySuccessCallback: () => void): Promise<WhoAmI> {
        const user = {
            username: username,
            password: password
        };
        const response = await this.http.post<WhoAmI>(environment.urlPrefix + '/users/login/', user);
        earlySuccessCallback();
        await this.operator.setWhoAmI(response);
        await this.redirectUser(response.user_id);
        return response;
    }

    /**
     * Redirects the user to the page where he came from. Boots OpenSlides,
     * if it wasn't done before.
     */
    public async redirectUser(userId: number): Promise<void> {
        if (!this.OpenSlides.booted) {
            await this.OpenSlides.afterLoginBootup(userId);
        }

        let redirect = this.OpenSlides.redirectUrl ? this.OpenSlides.redirectUrl : '/';

        const excludedUrls = ['login'];
        if (excludedUrls.some(url => redirect.includes(url))) {
            redirect = '/';
        }
        this.router.navigate([redirect]);
    }

    /**
     * Login for guests.
     */
    public async guestLogin(): Promise<void> {
        this.redirectUser(null);
    }

    /**
     * Logout function for both the client and the server.
     *
     * Will clear the datastore, update the current operator and
     * send a `post`-request to `/apps/users/logout/'`. Restarts OpenSlides.
     */
    public async logout(): Promise<void> {
        let response = null;
        try {
            response = await this.http.post<WhoAmI>(environment.urlPrefix + '/users/logout/', {});
        } catch (e) {
            // We do nothing on failures. Reboot OpenSlides anyway.
        }
        await this.DS.clear();
        await this.operator.setWhoAmI(response);
        await this.OpenSlides.reboot();
        this.router.navigate(['/']);
    }
}
