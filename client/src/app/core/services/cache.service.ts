import { Injectable } from '@angular/core';

/**
 * Handles all incoming and outgoing notify messages via {@link WebsocketService}.
 */
@Injectable({
    providedIn: 'root'
})
export class CacheService {
    /**
     * Constructor to create the NotifyService. Registers itself to the WebsocketService.
     * @param websocketService
     */
    constructor() {
        console.log('Cache constructor');
    }

    public test() {
        console.log('hi');
    }
}
