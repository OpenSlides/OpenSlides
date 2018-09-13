import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { OpenSlidesComponent } from 'app/openslides.component';
import { WebsocketService } from './websocket.service';
import { OperatorService } from './operator.service';
import { CacheService } from './cache.service';
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
     * Constructor to create the NotifyService. Registers itself to the WebsocketService.
     * @param cacheService
     * @param operator
     * @param websocketService
     * @param router
     * @param autoupdateService
     */
    public constructor(
        private cacheService: CacheService,
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
    public bootup(): void {
        // start autoupdate if the user is logged in:
        this.operator.whoAmI().subscribe(resp => {
            this.operator.guestsEnabled = resp.guest_enabled;
            if (!resp.user && !resp.guest_enabled) {
                this.redirectUrl = location.pathname;
                // Goto login, if the user isn't login and guests are not allowed
                this.router.navigate(['/login']);
            } else {
                this.afterLoginBootup(resp.user_id);
            }
        });
    }

    /**
     * the login bootup-sequence: Check (and maybe clear) the cache und setup the DataStore
     * and websocket.
     * @param userId
     */
    public afterLoginBootup(userId: number): void {
        // Else, check, which user was logged in last time
        this.cacheService.get<number>('lastUserLoggedIn').subscribe((id: number) => {
            // if the user id changed, reset the cache.
            if (userId !== id) {
                this.DS.clear((value: boolean) => {
                    this.setupDataStoreAndWebSocket();
                });
                this.cacheService.set('lastUserLoggedIn', userId);
            } else {
                this.setupDataStoreAndWebSocket();
            }
        });
    }

    /**
     * Init DS from cache and after this start the websocket service.
     */
    private setupDataStoreAndWebSocket(): void {
        this.DS.initFromCache().then((changeId: number) => {
            this.websocketService.connect(
                false,
                changeId
            );
        });
    }

    /**
     * SHuts down OpenSlides. The websocket is closed and the operator is not set.
     */
    public shutdown(): void {
        this.websocketService.close();
        this.operator.user = null;
    }

    /**
     * Shutdown and bootup.
     */
    public reboot(): void {
        this.shutdown();
        this.bootup();
    }

    /**
     * Verify that the operator is the same as it was before a reconnect.
     */
    private checkOperator(): void {
        this.operator.whoAmI().subscribe(resp => {
            // User logged off.
            if (!resp.user && !resp.guest_enabled) {
                this.shutdown();
                this.router.navigate(['/login']);
            } else {
                if (
                    (this.operator.user && this.operator.user.id !== resp.user_id) ||
                    (!this.operator.user && resp.user_id)
                ) {
                    // user changed
                    this.reboot();
                } else {
                    // User is still the same, but check for missed autoupdates.
                    this.autoupdateService.requestChanges();
                }
            }
        });
    }
}
