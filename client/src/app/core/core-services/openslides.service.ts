import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { take } from 'rxjs/operators';

import { WebsocketService } from './websocket.service';
import { OperatorService } from './operator.service';
import { StorageService } from './storage.service';
import { AutoupdateService } from './autoupdate.service';
import { DataStoreService } from './data-store.service';

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
     * Saves, if OpenSlides is fully booted. This means, that a user must be logged in
     * (Anonymous is also a user in this case). This is the case after `afterLoginBootup`.
     */
    private _booted = false;

    public get booted(): boolean {
        return this._booted;
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
        private DS: DataStoreService
    ) {
        // Handler that gets called, if the websocket connection reconnects after a disconnection.
        // There might have changed something on the server, so we check the operator, if he changed.
        websocketService.reconnectEvent.subscribe(() => {
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
        const response = await this.operator.whoAmIFromStorage();
        if (!response.user && !response.guest_enabled) {
            this.redirectUrl = location.pathname;
            this.redirectToLoginIfNotSubpage();
            this.checkOperator(false);
        } else {
            await this.afterLoginBootup(response.user_id);

            // Check for the operator via a async whoami (so no await here)
            // to validate, that the cache was correct.
            this.checkOperator(false);
        }
    }

    /**
     * Redirects the user to /login, if he isn't on a subpage.
     */
    private redirectToLoginIfNotSubpage(): void {
        if (!this.redirectUrl.includes('/login/')) {
            // Goto login, if the user isn't on a subpage like
            // legal notice or reset passwort view.
            this.router.navigate(['/login']);
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
        this._booted = true;
    }

    /**
     * Init DS from cache and after this start the websocket service.
     */
    private async setupDataStoreAndWebSocket(): Promise<void> {
        let changeId = await this.DS.initFromStorage();
        if (changeId > 0) {
            changeId += 1;
        }
        // disconnect the WS connection, if there was one. This is needed
        // to update the connection parameters, namely the cookies. If the user
        // is changed, the WS needs to reconnect, so the new connection holds the new
        // user information.
        if (this.websocketService.isConnected) {
            this.websocketService.close();
            // Wait for the disconnect.
            await this.websocketService.closeEvent.pipe(take(1)).toPromise();
        }
        this.websocketService.connect({ changeId: changeId }); // Request changes after changeId.
    }

    /**
     * Shuts OpenSlides down. The websocket is closed and the operator is not set.
     */
    public shutdown(): void {
        this.websocketService.close();
        this._booted = false;
    }

    /**
     * Shutdown and bootup.
     */
    public async reboot(): Promise<void> {
        this.shutdown();
        await this.bootup();
    }

    /**
     * Verify that the operator is the same as it was before. Should be alled on a reconnect.
     */
    private async checkOperator(requestChanges: boolean = true): Promise<void> {
        const response = await this.operator.whoAmI();
        // User logged off.
        if (!response.user && !response.guest_enabled) {
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
            }
        }
    }
}
