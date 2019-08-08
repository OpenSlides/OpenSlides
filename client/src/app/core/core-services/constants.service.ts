import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { WebsocketService } from './websocket.service';

/**
 * constants have a key associated with the data.
 */
interface Constants {
    [key: string]: any;
}

/**
 * Get constants from the server.
 *
 * @example
 * ```ts
 * this.constantsService.get('Settings').subscribe(constant => {
 *     console.log(constant);
 * });
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class ConstantsService {
    /**
     * The constants
     */
    private constants: Constants = {};

    /**
     * Pending requests will be notified by these subjects, one per key.
     */
    private subjects: { [key: string]: BehaviorSubject<any> } = {};

    /**
     * @param websocketService
     */
    public constructor(private websocketService: WebsocketService) {
        // The hook for recieving constants.
        websocketService.getOberservable<Constants>('constants').subscribe(constants => {
            this.constants = constants;
            Object.keys(this.subjects).forEach(key => {
                this.subjects[key].next(this.constants[key]);
            });
        });

        // We can request constants, if the websocket connection opens.
        // On retries, the `refresh()` method is called by the OpenSlidesService, so
        // here we do not need to take care about this.
        websocketService.noRetryConnectEvent.subscribe(() => {
            this.refresh();
        });
    }

    /**
     * Get the constant named by key.
     * @param key The constant to get.
     */
    public get<T>(key: string): Observable<T> {
        if (!this.subjects[key]) {
            this.subjects[key] = new BehaviorSubject<any>(this.constants[key]);
        }
        return this.subjects[key].asObservable().pipe(filter(x => !!x));
    }

    /**
     * Refreshed the constants
     */
    public refresh(): Promise<void> {
        if (!this.websocketService.isConnected) {
            return;
        }
        this.websocketService.send('constants', {});
    }
}
