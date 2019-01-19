import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { OpenSlidesComponent } from 'app/openslides.component';
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
export class OpenSlidesService extends OpenSlidesComponent {
    /**
     * if the user tries to access a certain URL without being authenticated, the URL will be stored here
     */
    public redirectUrl: string;

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
        super();

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
        const response = await this.operator.whoAmI();
        this.operator.guestsEnabled = response.guest_enabled;
        if (!response.user && !response.guest_enabled) {
            this.redirectUrl = location.pathname;
            // Goto login, if the user isn't login and guests are not allowed
            this.router.navigate(['/login']);
        } else {
            await this.afterLoginBootup(response.user_id);
        }
    }

    /**
     * the login bootup-sequence: Check (and maybe clear) the cache und setup the DataStore
     * and websocket. This "login" also may be the "login" of an anonymous when he is using
     * OpenSlides as a guest.
     * @param userId
     */
    public async afterLoginBootup(userId: number): Promise<void> {
        // Else, check, which user was logged in last time
        const lastUserId = await this.storageService.get<number>('lastUserLoggedIn');
        // if the user changed, reset the cache and save the new user.
        if (userId !== lastUserId) {
            await this.DS.clear();
            await this.storageService.set('lastUserLoggedIn', userId);
        }
        await this.setupDataStoreAndWebSocket();
    }

    /**
     * Init DS from cache and after this start the websocket service.
     */
    private async setupDataStoreAndWebSocket(): Promise<void> {
        let changeId = await this.DS.initFromStorage();
        if (changeId > 0) {
            changeId += 1;
        }
        this.websocketService.connect({ changeId: changeId }); // Request changes after changeId.
    }

    /**
     * Shuts OpenSlides down. The websocket is closed and the operator is not set.
     */
    public shutdown(): void {
        this.websocketService.close();
        this.operator.user = null;
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
    private async checkOperator(): Promise<void> {
        const response = await this.operator.whoAmI();
        // User logged off.
        if (!response.user && !response.guest_enabled) {
            this.shutdown();
            this.router.navigate(['/login']);
        } else {
            if (
                (this.operator.user && this.operator.user.id !== response.user_id) ||
                (!this.operator.user && response.user_id)
            ) {
                // user changed
                await this.reboot();
            } else {
                // User is still the same, but check for missed autoupdates.
                this.autoupdateService.requestChanges();
            }
        }
    }
}
