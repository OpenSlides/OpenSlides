import { Injectable } from '@angular/core';

import { OpenSlidesComponent } from 'app/openslides.component';
import { WebsocketService } from '../core-services/websocket.service';
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
 * this.constantsService.get('OpenSlidesSettings').subscribe(constant => {
 *     console.log(constant);
 * });
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class ConstantsService extends OpenSlidesComponent {
    /**
     * The constants
     */
    private constants: Constants;

    /**
     * Flag, if the websocket connection is open.
     */
    private websocketOpen = false;

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
        super();

        // The hook for recieving constants.
        websocketService.getOberservable<Constants>('constants').subscribe(constants => {
            this.constants = constants;
            if (this.pending) {
                // send constants to subscribers that await constants.
                this.pending = false;
                Object.keys(this.pendingSubject).forEach(key => {
                    this.pendingSubject[key].next(this.constants[key]);
                });
            }
        });

        // We can request constants, if the websocket connection opens.
        websocketService.connectEvent.subscribe(() => {
            if (!this.websocketOpen && this.pending) {
                this.websocketService.send('constants', {});
            }
            this.websocketOpen = true;
        });
    }

    /**
     * Get the constant named by key.
     * @param key The constant to get.
     */
    public get(key: string): Observable<any> {
        if (this.constants) {
            return of(this.constants[key]);
        } else {
            // we have to request constants.
            if (!this.pending) {
                this.pending = true;
                // if the connection is open, we directly can send the request.
                if (this.websocketOpen) {
                    this.websocketService.send('constants', {});
                }
            }
            if (!this.pendingSubject[key]) {
                this.pendingSubject[key] = new Subject<any>();
            }
            return this.pendingSubject[key].asObservable();
        }
    }
}
