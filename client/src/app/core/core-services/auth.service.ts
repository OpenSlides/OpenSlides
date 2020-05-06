import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from 'environments/environment';

import { OperatorService, WhoAmI } from 'app/core/core-services/operator.service';
import { DEFAULT_AUTH_TYPE, UserAuthType } from 'app/shared/models/users/user';
import { DataStoreService } from './data-store.service';
import { HttpService } from './http.service';
import { OpenSlidesService } from './openslides.service';

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
     * Try to log in a user with a given auth type
     *
     * - Type "default": username and password needed; the earlySuccessCallback will be called.
     * - Type "saml": The windows location will be changed to the single-sign-on service initiator.
     */
    public async login(
        authType: UserAuthType,
        username: string,
        password: string,
        earlySuccessCallback: () => void
    ): Promise<void> {
        if (authType === 'default') {
            const user = {
                username: username,
                password: password
            };
            const response = await this.http.post<WhoAmI>(environment.urlPrefix + '/users/login/', user);
            earlySuccessCallback();
            await this.OpenSlides.shutdown();
            await this.operator.setWhoAmI(response);
            await this.OpenSlides.afterLoginBootup(response.user_id);
            await this.redirectUser(response.user_id);
        } else if (authType === 'saml') {
            await this.operator.clearWhoAmIFromStorage(); // This is important:
            // Then returning to the page, we do not want to have anything cached so a
            // fresh whoami is executed.
            window.location.href = environment.urlPrefix + '/saml/?sso'; // Bye
        } else {
            throw new Error(`Unsupported auth type "${authType}"`);
        }
    }

    /**
     * Redirects the user to the page where he came from. Boots OpenSlides,
     * if it wasn't done before.
     */
    public async redirectUser(userId: number): Promise<void> {
        if (!this.OpenSlides.isBooted) {
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
        const authType = this.operator.authType.getValue();
        if (authType === DEFAULT_AUTH_TYPE) {
            let response = null;
            try {
                response = await this.http.post<WhoAmI>(environment.urlPrefix + '/users/logout/', {});
            } catch (e) {
                // We do nothing on failures. Reboot OpenSlides anyway.
            }
            this.router.navigate(['/']);
            await this.DS.clear();
            await this.operator.setWhoAmI(response);
            await this.OpenSlides.reboot();
        } else if (authType === 'saml') {
            await this.DS.clear();
            await this.operator.setWhoAmI(null);
            window.location.href = environment.urlPrefix + '/saml/?slo'; // Bye
        } else {
            throw new Error(`Unsupported auth type "${authType}"`);
        }
    }
}
