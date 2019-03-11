import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { take } from 'rxjs/operators';

import { WebsocketService } from './websocket.service';
import { OperatorService } from './operator.service';
import { StorageService } from './storage.service';
import { AutoupdateService } from './autoupdate.service';
import { DataStoreService } from './data-store.service';
import { perf } from 'perf';

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

        perf("OS bootup", "OSService");

        this.bootup();
    }

    /**
     * the bootup-sequence: Do a whoami request and if it was successful, do
     * {@method afterLoginBootup}. If not, redirect the user to the login page.
     */
    public async bootup(): Promise<void> {
        // start autoupdate if the user is logged in:
        const response = await this.operator.whoAmIFromStorage();
        perf("Got WhoAmI from storage", "OSService");
        if (!response.user && !response.guest_enabled) {
            this.redirectUrl = location.pathname;

            // let the use navigate and reload on every login-page
            if (this.redirectUrl.includes('/login/')) {
                // Allow free navigation in the children of the login page
                // required for resetting password and direct navigation to legal notice
                // and privacy policy.
                this.router.navigate([this.redirectUrl]);
            } else {
                // Goto login, if the user isn't login and guests are not allowed
                this.router.navigate(['/login']);
            }

            this.checkOperator(false);
        } else {
            await this.afterLoginBootup(response.user_id);

            // Check for the operator via a async whoami (so no await here)
            // to validate, that the cache was correct.
            this.checkOperator(false);
        }
    }

    /**
     * the login bootup-sequence: Check (and maybe clear) the cache und setup the DataStore
     * and websocket. This "login" also may be the "login" of an anonymous when he is using
     * OpenSlides as a guest.
     * @param userId the id or null for guest
     */
    public async afterLoginBootup(userId: number | null): Promise<void> {
        console.log('user id', userId);
        // Check, which user was logged in last time
        const lastUserId = await this.storageService.get<number>('lastUserLoggedIn');
        perf("Got userid from storage", "OSService");
        // if the user changed, reset the cache and save the new user.
        if (userId !== lastUserId) {
            await this.DS.clear();
            await this.storageService.set('lastUserLoggedIn', userId);
            perf("switched user", "OSService");
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
        perf("DS init from storage", "OSService");
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
        perf("bootup finished", "OSService");
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
            this.router.navigate(['/login']);
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
