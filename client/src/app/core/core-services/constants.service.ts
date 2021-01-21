import { Injectable } from '@angular/core';

import { environment } from 'environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { CommunicationManagerService } from './communication-manager.service';
import { HttpService } from './http.service';

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

    public constructor(communicationManager: CommunicationManagerService, private http: HttpService) {
        communicationManager.startCommunicationEvent.subscribe(async () => {
            this.constants = await this.http.get<Constants>(environment.urlPrefix + '/core/constants/');
            Object.keys(this.subjects).forEach(key => {
                this.subjects[key].next(this.constants[key]);
            });
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
}
