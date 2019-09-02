import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

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
    /**
     * BehaviorSubject to receive further status values.
     */
    private offline = new BehaviorSubject<boolean>(false);

    /**
     * Determines of you are either in Offline mode or not connected via websocket
     *
     * @returns whether the client is offline or not connected
     */
    public isOffline(): Observable<boolean> {
        return this.offline;
    }

    /**
     * Sets the offline flag. Restores the DataStoreService to the last known configuration.
     */
    public goOfflineBecauseFailedWhoAmI(): void {
        if (!this.offline.getValue()) {
            console.log('offline because whoami failed.');
        }
        this.offline.next(true);
    }

    /**
     * Sets the offline flag, because there is no connection to the server.
     */
    public goOfflineBecauseConnectionLost(): void {
        if (!this.offline.getValue()) {
            console.log('offline because connection lost.');
        }
        this.offline.next(true);
    }

    /**
     * Function to return to online-status.
     */
    public goOnline(): void {
        this.offline.next(false);
    }
}
