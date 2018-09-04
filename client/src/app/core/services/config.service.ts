import { Injectable } from '@angular/core';

import { OpenSlidesComponent } from 'app/openslides.component';
import { Observable, BehaviorSubject } from 'rxjs';
import { Config } from '../../shared/models/core/config';

/**
 * Handler for config variables.
 *
 * @example
 * ```ts
 * this.configService.get('general_event_name').subscribe(value => {
 *     console.log(value);
 * });
 * ```
 *
 * @example
 * ```ts
 * const value = this.configService.instant('general_event_name');
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class ConfigService extends OpenSlidesComponent {
    /**
     * Stores a subject per key. Values are published, if the DataStore gets an update.
     */
    private configSubjects: { [key: string]: BehaviorSubject<any> } = {};

    /**
     * Listen for changes of config variables.
     */
    public constructor() {
        super();

        this.DS.getObservable().subscribe(data => {
            // on changes notify the observers for specific keys.
            if (data instanceof Config && this.configSubjects[data.key]) {
                this.configSubjects[data.key].next(data.value);
            }
        });
    }

    /**
     * Get the constant named by key from the DataStore. If the DataStore isn't up to date or
     * not filled via autoupdates the results may be wrong/empty. Use this with caution.
     *
     * Usefull for synchronos code, e.g. during generation of PDFs, when the DataStore is filled.
     *
     * @param key The config value to get from.
     */
    public instant(key: string): any {
        const values = this.DS.filter<Config>('core/config', value => value.key === key);
        if (values.length > 1) {
            throw new Error('More keys found then expected');
        } else if (values.length === 1) {
            return values[0].value;
        } else {
            return;
        }
    }

    /**
     * Get an observer for the config value given by the key.
     *
     * @param key The config value to get from.
     */
    public get(key: string): Observable<any> {
        if (!this.configSubjects[key]) {
            this.configSubjects[key] = new BehaviorSubject<any>(this.instant(key));
        }
        return this.configSubjects[key].asObservable();
    }
}
