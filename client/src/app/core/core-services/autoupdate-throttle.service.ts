import { EventEmitter, Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';

import { AutoupdateFormat } from 'app/core/definitions/autoupdate-format';
import { trailingThrottleTime } from 'app/core/rxjs/trailing-throttle-time';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { ConstantsService } from './constants.service';
import { HttpService } from './http.service';

interface ThrottleSettings {
    AUTOUPDATE_DELAY?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AutoupdateThrottleService {
    private readonly _autoupdatesToInject = new Subject<AutoupdateFormat>();

    public get autoupdatesToInject(): Observable<AutoupdateFormat> {
        return this._autoupdatesToInject.asObservable();
    }

    private readonly receivedAutoupdate = new EventEmitter<void>();

    private pendingAutoupdates = [];

    private disabledUntil: number | null = null;

    private delay = 0;

    private maxSeenChangeId = 0;

    private get isActive(): boolean {
        return this.delay !== 0;
    }

    public constructor(private constantsService: ConstantsService, private httpService: HttpService) {
        this.constantsService.get<ThrottleSettings>('Settings').subscribe(settings => {
            // This is a one-shot. If the delay was set one time >0, it cannot be changed afterwards.
            // A change is more complicated since you have to unsubscribe, clean pending autoupdates,
            // subscribe again and make sure, that no autoupdate is missed.
            if (this.delay === 0 && settings.AUTOUPDATE_DELAY) {
                this.delay = 1000 * settings.AUTOUPDATE_DELAY;
                console.log(`Configured autoupdate delay: ${this.delay}ms`);
                this.receivedAutoupdate
                    .pipe(trailingThrottleTime(this.delay))
                    .subscribe(() => this.processPendingAutoupdates());
            } else if (this.delay === 0) {
                console.log('No autoupdate delay');
            }
        });

        this.httpService.responseChangeIds.subscribe(changeId => this.disableUntil(changeId));
    }

    public newAutoupdate(autoupdate: AutoupdateFormat): void {
        if (autoupdate.to_change_id > this.maxSeenChangeId) {
            this.maxSeenChangeId = autoupdate.to_change_id;
        }

        if (!this.isActive) {
            this._autoupdatesToInject.next(autoupdate);
        } else if (this.disabledUntil !== null) {
            this._autoupdatesToInject.next(autoupdate);
            if (autoupdate.to_change_id >= this.disabledUntil) {
                this.disabledUntil = null;
                console.log('Throttling autoupdates again');
            }
        } else if (autoupdate.all_data) {
            // all_data=true (aka initial data) should be processed immediatly
            // but since there can be pending autoupdates, add it there and
            // process them now!
            this.pendingAutoupdates.push(autoupdate);
            this.processPendingAutoupdates();
        } else {
            this.pendingAutoupdates.push(autoupdate);
            this.receivedAutoupdate.emit();
        }
    }

    public disableUntil(changeId: number): void {
        // Wait for an autoupdate with to_id >= changeId.
        if (!this.isActive) {
            return;
        }
        this.processPendingAutoupdates();
        // Checking with maxSeenChangeId is for the following race condition:
        // If the autoupdate comes before the response, it must not be throttled.
        // But flushing pending autoupdates is important since *if* the autoupdate
        // was early, it is in the pending queue.
        if (changeId <= this.maxSeenChangeId) {
            return;
        }
        console.log('Disable autoupdate until change id', changeId);
        this.disabledUntil = changeId;
    }

    /**
     * discard all pending autoupdates and resets the timer
     */
    public discard(): void {
        this.pendingAutoupdates = [];
    }

    private processPendingAutoupdates(): void {
        if (this.pendingAutoupdates.length === 0) {
            return;
        }
        const autoupdates = this.pendingAutoupdates;
        this.discard();

        console.log(`Processing ${autoupdates.length} pending autoupdates`);
        const autoupdate = this.mergeAutoupdates(autoupdates);
        this._autoupdatesToInject.next(autoupdate);
    }

    private mergeAutoupdates(autoupdates: AutoupdateFormat[]): AutoupdateFormat {
        const mergedAutoupdate: AutoupdateFormat = {
            changed: {},
            deleted: {},
            from_change_id: autoupdates[0].from_change_id,
            to_change_id: autoupdates[autoupdates.length - 1].to_change_id,
            all_data: false
        };

        let lastToChangeId = null;
        for (const au of autoupdates) {
            if (lastToChangeId === null) {
                lastToChangeId = au.to_change_id;
            } else {
                if (au.from_change_id !== lastToChangeId) {
                    console.warn('!!!', autoupdates, au);
                }
                lastToChangeId = au.to_change_id;
            }

            this.applyAutoupdate(au, mergedAutoupdate);
        }

        return mergedAutoupdate;
    }

    private applyAutoupdate(from: AutoupdateFormat, into: AutoupdateFormat): void {
        if (from.all_data) {
            into.all_data = true;
            into.changed = from.changed;
            into.deleted = from.deleted;
            return;
        }

        for (const collection of Object.keys(from.deleted)) {
            for (const id of from.deleted[collection]) {
                if (into.changed[collection]) {
                    into.changed[collection] = into.changed[collection].filter(obj => (obj as Identifiable).id !== id);
                }
                if (!into.deleted[collection]) {
                    into.deleted[collection] = [];
                }
                into.deleted[collection].push(id);
            }
        }

        for (const collection of Object.keys(from.changed)) {
            for (const obj of from.changed[collection]) {
                if (into.deleted[collection]) {
                    into.deleted[collection] = into.deleted[collection].filter(id => id !== (obj as Identifiable).id);
                }
                if (!into.changed[collection]) {
                    into.changed[collection] = [];
                }
                into.changed[collection].push(obj);
            }
        }
    }
}
