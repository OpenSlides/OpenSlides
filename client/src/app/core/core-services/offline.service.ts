import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';

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
     */
    public constructor(private socketService: WebsocketService) {}

    /**
     * Determines of you are either in Offline mode or not connected via websocket
     *
     * @returns whether the client is offline or not connected
     */
    public isOffline(): boolean {
        return this.offline || !this.socketService.isConnected;
    }

    /**
     * Sets the offline flag. Restores the DataStoreService to the last known configuration.
     */
    public goOfflineBecauseFailedWhoAmI(): void {
        this._offline = true;
        console.log('offline because whoami failed.');
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
}
