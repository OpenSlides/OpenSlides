import { Injectable } from '@angular/core';

import { CommunicationManagerService } from './communication-manager.service';
import { OfflineBroadcastService, OfflineReason } from './offline-broadcast.service';
import { OpenSlidesService } from './openslides.service';
import { OperatorService, WhoAmI } from './operator.service';

/**
 * This service handles everything connected with being offline.
 *
 * TODO: This is just a stub. Needs to be done in the future; Maybe we cancel this whole concept
 * of this service. We'll see what happens here..
 */
@Injectable({
    providedIn: 'root'
})
export class OfflineService {
    private reason: OfflineReason | null;

    public constructor(
        private OpenSlides: OpenSlidesService,
        private offlineBroadcastService: OfflineBroadcastService,
        private operatorService: OperatorService,
        private communicationManager: CommunicationManagerService
    ) {
        this.offlineBroadcastService.goOfflineObservable.subscribe((reason: OfflineReason) => this.goOffline(reason));
    }

    /**
     * Helper function to set offline status
     */
    public goOffline(reason: OfflineReason): void {
        if (this.offlineBroadcastService.isOffline()) {
            return;
        }
        this.reason = reason;

        if (reason === OfflineReason.ConnectionLost) {
            console.log('offline because connection lost.');
        } else if (reason === OfflineReason.WhoAmIFailed) {
            console.log('offline because whoami failed.');
        } else {
            console.error('No such offline reason', reason);
        }

        this.offlineBroadcastService.isOfflineSubject.next(true);
        this.checkStillOffline();
    }

    private checkStillOffline(): void {
        const timeout = Math.floor(Math.random() * 3000 + 2000);
        console.log(`Try to go online in ${timeout} ms`);

        setTimeout(async () => {
            let online: boolean;
            let whoami: WhoAmI | null = null;

            if (this.reason === OfflineReason.ConnectionLost) {
                online = await this.communicationManager.isCommunicationServiceOnline();
                console.log('is communication online? ', online);
            } else if (this.reason === OfflineReason.WhoAmIFailed) {
                const result = await this.operatorService.whoAmI();
                online = result.online;
                whoami = result.whoami;
                console.log('is whoami reachable?', online);
            }

            if (online) {
                await this.goOnline(whoami);
                // TODO: check all other reasons -> e.g. if the
                // connection was lost, the operator must be checked and the other way
                // around the comminucation must be started!!

                // stop trying.
            } else {
                // continue trying.
                this.checkStillOffline();
            }
        }, timeout);
    }

    /**
     * Function to return to online-status.
     *
     * First, we have to check, if all other sources (except this.reason) are online, too.
     * This results in definetly having a whoami response at this point.
     * If this is the case, we need to setup everything again:
     * 1) check the operator. If this allowes for an logged in state (or anonymous is OK), do
     *    step 2, otherwise done.
     * 2) enable communications.
     */
    private async goOnline(whoami?: WhoAmI): Promise<void> {
        console.log('go online!', this.reason, whoami);
        if (this.reason === OfflineReason.ConnectionLost) {
            // now we have to check whoami
            const result = await this.operatorService.whoAmI();
            if (!result.online) {
                console.log('whoami down.');
                this.reason = OfflineReason.WhoAmIFailed;
                this.checkStillOffline();
                return;
            }
            whoami = result.whoami;
        } else if (this.reason === OfflineReason.WhoAmIFailed) {
            const online = await this.communicationManager.isCommunicationServiceOnline();
            if (!online) {
                console.log('communication down.');
                this.reason = OfflineReason.ConnectionLost;
                this.checkStillOffline();
                return;
            }
        }
        console.log('we are online!');

        // Ok, we are online now!
        const isLoggedIn = await this.OpenSlides.checkWhoAmI(whoami);
        console.log('logged in:', isLoggedIn);
        if (isLoggedIn) {
            this.communicationManager.startCommunication();
        }
        console.log('done');

        this.offlineBroadcastService.isOfflineSubject.next(false);
    }
}
