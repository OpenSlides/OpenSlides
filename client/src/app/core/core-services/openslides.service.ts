import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { BehaviorSubject } from 'rxjs';

import { CommunicationManagerService } from './communication-manager.service';
import { DataStoreService } from './data-store.service';
import { OfflineBroadcastService, OfflineReason } from './offline-broadcast.service';
import { OpenSlidesStatusService } from './openslides-status.service';
import { OperatorService, WhoAmI } from './operator.service';
import { StorageService } from './storage.service';

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

    public constructor(
        private storageService: StorageService,
        private operator: OperatorService,
        private openslidesStatus: OpenSlidesStatusService,
        private router: Router,
        private DS: DataStoreService,
        private communicationManager: CommunicationManagerService,
        private offlineBroadcastService: OfflineBroadcastService
    ) {
        this.bootup();
    }

    /**
     * the bootup-sequence: Do a whoami request and if it was successful, do
     * {@method afterLoginBootup}. If not, redirect the user to the login page.
     */
    public async bootup(): Promise<void> {
        // start autoupdate if the user is logged in:
        let whoami = await this.operator.whoAmIFromStorage();
        const needToCheckOperator = !!whoami;

        if (!whoami) {
            const response = await this.operator.whoAmI();
            if (!response.online) {
                this.offlineBroadcastService.goOffline(OfflineReason.WhoAmIFailed);
            }
            whoami = response.whoami;
        }

        if (!whoami.user && !whoami.guest_enabled) {
            if (!location.pathname.includes('error')) {
                this.redirectUrl = location.pathname;
            }
            this.redirectToLoginIfNotSubpage();
        } else {
            await this.afterLoginBootup(whoami.user_id);
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
        await this.setupDataStoreAndStartCommunication();
        // Now finally booted.
        this.booted.next(true);
    }

    /**
     * Init DS from cache and after this start the websocket service.
     */
    private async setupDataStoreAndStartCommunication(): Promise<void> {
        await this.DS.initFromStorage();
        await this.openslidesStatus.stable;
        this.communicationManager.startCommunication();
    }

    /**
     * Shuts down OpenSlides.
     */
    public async shutdown(): Promise<void> {
        this.communicationManager.closeConnections();
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

    public async checkOperator(requestChanges: boolean = true): Promise<void> {
        const response = await this.operator.whoAmI();
        if (!response.online) {
            this.offlineBroadcastService.goOffline(OfflineReason.WhoAmIFailed);
        }
        await this.checkWhoAmI(response.whoami, requestChanges);
    }

    /**
     * Verify that the operator is the same as it was before. Should be alled on a reconnect.
     *
     * @returns true, if the user is still logged in
     */
    public async checkWhoAmI(whoami: WhoAmI, requestChanges: boolean = true): Promise<boolean> {
        let isLoggedIn = false;
        // User logged off.
        if (!whoami.user && !whoami.guest_enabled) {
            await this.shutdown();
            this.redirectToLoginIfNotSubpage();
        } else {
            isLoggedIn = true;
            if (
                (this.operator.user && this.operator.user.id !== whoami.user_id) ||
                (!this.operator.user && whoami.user_id)
            ) {
                // user changed
                await this.DS.clear();
                await this.reboot();
            }
        }

        return isLoggedIn;
    }
}
