import { Injectable } from '@angular/core';

import { WebsocketService } from './websocket.service';
import { Observable, of, Subject } from 'rxjs';

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
    private constants: Constants;

    /**
     * Flag, if constants are requested, but the server hasn't send them yet.
     */
    private pending = false;

    /**
     * Pending requests will be notified by these subjects, one per key.
     */
    private pendingSubject: { [key: string]: Subject<any> } = {};

    /**
     * @param websocketService
     */
    public constructor(private websocketService: WebsocketService) {
        // The hook for recieving constants.
        websocketService.getOberservable<Constants>('constants').subscribe(constants => {
            this.constants = constants;
            if (this.pending) {
                // send constants to subscribers that await constants.
                this.pending = false;
                this.informSubjects();
            }
        });

        // We can request constants, if the websocket connection opens.
        // On retries, the `refresh()` method is called by the OpenSlidesService, so
        // here we do not need to take care about this.
        websocketService.noRetryConnectEvent.subscribe(() => {
            if (this.pending) {
                this.websocketService.send('constants', {});
            }
        });
    }

    /**
     * Inform subjects about changes.
     */
    private informSubjects(): void {
        Object.keys(this.pendingSubject).forEach(key => {
            this.pendingSubject[key].next(this.constants[key]);
        });
    }

    /**
     * Get the constant named by key.
     * @param key The constant to get.
     */
    public get<T>(key: string): Observable<T> {
        if (this.constants) {
            return of(this.constants[key]);
        } else {
            // we have to request constants.
            if (!this.pending) {
                this.pending = true;
                // if the connection is open, we directly can send the request.
                if (this.websocketService.isConnected) {
                    this.websocketService.send('constants', {});
                }
            }
            if (!this.pendingSubject[key]) {
                this.pendingSubject[key] = new Subject<any>();
            }
            return this.pendingSubject[key].asObservable() as Observable<T>;
        }
    }

    /**
     * Refreshed the constants
     */
    public async refresh(): Promise<void> {
        if (!this.websocketService.isConnected) {
            return;
        }
        this.constants = await this.websocketService.sendAndGetResponse('constants', {});
        this.informSubjects();
    }
}
