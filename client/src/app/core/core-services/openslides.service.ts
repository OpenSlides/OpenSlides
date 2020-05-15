import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { BehaviorSubject } from 'rxjs';

import { AutoupdateService } from './autoupdate.service';
import { ConstantsService } from './constants.service';
import { DataStoreService } from './data-store.service';
import { OperatorService } from './operator.service';
import { StorageService } from './storage.service';
import { WebsocketService } from './websocket.service';

/**
 * Handles the bootup/showdown of this application.
 */
@Injectable({
    providedIn: 'root'
})
export class OpenSlidesService {
    /**
     * If the user tries to access a certain URL without being authenticated, the URL will be stored here
     */
    public redirectUrl: string;

    /**
     * Subject to hold the flag `booted`.
     */
    public readonly booted = new BehaviorSubject(false);

    /**
     * Saves, if OpenSlides is fully booted. This means, that a user must be logged in
     * (Anonymous is also a user in this case). This is the case after `afterLoginBootup`.
     */
    public get isBooted(): boolean {
        return this.booted.value;
    }

    /**
     * Constructor to create the OpenSlidesService. Registers itself to the WebsocketService.
     * @param storageService
     * @param operator
     * @param websocketService
     * @param router
     * @param autoupdateService
     * @param DS
     */
    public constructor(
        private storageService: StorageService,
        private operator: OperatorService,
        private websocketService: WebsocketService,
        private router: Router,
        private autoupdateService: AutoupdateService,
        private DS: DataStoreService,
        private constantsService: ConstantsService
    ) {
        // Handler that gets called, if the websocket connection reconnects after a disconnection.
        // There might have changed something on the server, so we check the operator, if he changed.
        websocketService.retryReconnectEvent.subscribe(() => {
            this.checkOperator();
        });

        this.bootup();
    }

    /**
     * the bootup-sequence: Do a whoami request and if it was successful, do
     * {@method afterLoginBootup}. If not, redirect the user to the login page.
     */
    public async bootup(): Promise<void> {
        // start autoupdate if the user is logged in:
        let response = await this.operator.whoAmIFromStorage();
        const needToCheckOperator = !!response;

        if (!response) {
            response = await this.operator.whoAmI();
        }

        if (!response.user && !response.guest_enabled) {
            if (!location.pathname.includes('error')) {
                this.redirectUrl = location.pathname;
            }
            this.redirectToLoginIfNotSubpage();
        } else {
            await this.afterLoginBootup(response.user_id);
        }

        if (needToCheckOperator) {
            // Check for the operator via a async whoami (so no await here)
            // to validate, that the cache was correct.
            this.checkOperator(false);
        }
    }

    /**
     * Redirects the user to /login, if he isn't on a subpage.
     */
    private redirectToLoginIfNotSubpage(): void {
        if (!this.redirectUrl || !this.redirectUrl.includes('/login/')) {
            // Goto login, if the user isn't on a subpage like
            // legal notice or reset passwort view.
            // If other routing requests are active (e.g. to `/` or `/error`)
            // wait for the authguard to finish to navigate to /login. This
            // redirect is more important than the other ones.
            setTimeout(() => {
                this.router.navigate(['/login']);
            });
        }
    }

    /**
     * the login bootup-sequence: Check (and maybe clear) the cache und setup the DataStore
     * and websocket. This "login" also may be the "login" of an anonymous when he is using
     * OpenSlides as a guest.
     * @param userId the id or null for guest
     */
    public async afterLoginBootup(userId: number | null): Promise<void> {
        // Check, which user was logged in last time
        const lastUserId = await this.storageService.get<number>('lastUserLoggedIn');
        // if the user changed, reset the cache and save the new user.
        if (userId !== lastUserId) {
            await this.DS.clear();
            await this.storageService.set('lastUserLoggedIn', userId);
        }
        await this.setupDataStoreAndWebSocket();
        // Now finally booted.
        this.booted.next(true);
    }

    /**
     * Init DS from cache and after this start the websocket service.
     */
    private async setupDataStoreAndWebSocket(): Promise<void> {
        const changeId = await this.DS.initFromStorage();
        // disconnect the WS connection, if there was one. This is needed
        // to update the connection parameters, namely the cookies. If the user
        // is changed, the WS needs to reconnect, so the new connection holds the new
        // user information.
        if (this.websocketService.isConnected) {
            await this.websocketService.close(); // Wait for the disconnect.
        }
        await this.websocketService.connect(changeId); // Request changes after changeId.
    }

    /**
     * Shuts down OpenSlides. The websocket connection is closed and the operator is not set.
     */
    public async shutdown(): Promise<void> {
        await this.websocketService.close();
        this.booted.next(false);
    }

    /**
     * Shutdown and bootup.
     */
    public async reboot(): Promise<void> {
        await this.shutdown();
        await this.bootup();
    }

    /**
     * Clears the client cache and restarts OpenSlides. Results in "flickering" of the
     * login mask, because the cached operator is also cleared.
     */
    public async reset(): Promise<void> {
        await this.shutdown();
        await this.storageService.clear();
        await this.bootup();
    }

    /**
     * Verify that the operator is the same as it was before. Should be alled on a reconnect.
     */
    private async checkOperator(requestChanges: boolean = true): Promise<void> {
        const response = await this.operator.whoAmI();
        // User logged off.
        if (!response.user && !response.guest_enabled) {
            this.websocketService.cancelReconnectenRetry();
            await this.shutdown();
            this.redirectToLoginIfNotSubpage();
        } else {
            if (
                (this.operator.user && this.operator.user.id !== response.user_id) ||
                (!this.operator.user && response.user_id)
            ) {
                // user changed
                await this.DS.clear();
                await this.reboot();
            } else if (requestChanges) {
                // User is still the same, but check for missed autoupdates.
                this.autoupdateService.requestChanges();
                this.constantsService.refresh();
            }
        }
    }
}
