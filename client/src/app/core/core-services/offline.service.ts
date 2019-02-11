import { Injectable } from '@angular/core';

import { DataStoreService } from './data-store.service';
import { WhoAmIResponse } from './operator.service';

/**
 * This service handles everything connected with being offline.
 *
 * TODO: This is just a stub. Needs to be done in the future; Maybe we cancel this whole concept
 * of this service. We'll see whats happens here..
 */
@Injectable({
    providedIn: 'root'
})
export class OfflineService {
    private _offline = false;

    public get offline(): boolean {
        return this._offline;
    }

    /**
     * Constructor to create the AutoupdateService. Calls the constructor of the parent class.
     * @param DS
     */
    public constructor(private DS: DataStoreService) {}

    /**
     * Sets the offline flag. Restores the DataStoreService to the last known configuration.
     */
    public async goOfflineBecauseFailedWhoAmI(): Promise<void> {
        this._offline = true;
        console.log('offline because whoami failed.');

        // TODO: Init the DS from cache.
        await this.DS.clear();
    }

    /**
     * TODO: Should be somehow connected to the websocket service.
     */
    public goOfflineBecauseConnectionLost(): void {
        this._offline = true;
        console.log('offline because connection lost.');
    }

    /**
     * TODO: Should be somehow connected to the websocket service.
     */
    public goOnline(): void {
        this._offline = false;
    }

    /**
     * Returns the last cached WhoAmI response.
     */
    public getLastWhoAmI(): WhoAmIResponse {
        // TODO: use a cached WhoAmI response.
        return {
            user_id: null,
            guest_enabled: false,
            user: null
        };
    }
}
