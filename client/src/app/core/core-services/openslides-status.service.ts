import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { History } from 'app/shared/models/core/history';
import { BannerDefinition, BannerService } from '../ui-services/banner.service';
import { Deferred } from '../promises/deferred';

export interface ErrorInformation {
    error: any;
    name?: string;
}

/**
 * Holds information about OpenSlides. This is not included into other services to
 * avoid circular dependencies.
 */
@Injectable({
    providedIn: 'root'
})
export class OpenSlidesStatusService {
    /**
     * in History mode, saves the history point.
     */
    private history: History = null;
    private historyBanner: BannerDefinition = {
        type: 'history'
    };

    private tooLessLocalStorage = false;

    /**
     * Returns, if OpenSlides is in the history mode.
     */
    public get isInHistoryMode(): boolean {
        return !!this.history;
    }

    public get stable(): Promise<void> {
        return this._stable;
    }

    public isPrioritizedClient = false;

    public readonly currentError = new BehaviorSubject<ErrorInformation | null>(null);

    private _stable = new Deferred();
    private _bootedSubject = new BehaviorSubject<boolean>(false);

    /**
     * Ctor, does nothing.
     */
    public constructor(private banner: BannerService) {}

    public setStable(): void {
        this._stable.resolve();
        this._bootedSubject.next(true);
    }

    /**
     * Calls the getLocaleString function of the history object, if present.
     *
     * @param format the required date representation format
     * @returns the timestamp as string
     */
    public getHistoryTimeStamp(format: string): string {
        return this.history ? this.history.getLocaleString(format) : null;
    }

    /**
     * Enters the history mode
     */
    public enterHistoryMode(history: History): void {
        this.history = history;
        this.banner.addBanner(this.historyBanner);
    }

    /**
     * Leaves the history mode
     */
    public leaveHistoryMode(): void {
        this.history = null;
        this.banner.removeBanner(this.historyBanner);
    }

    public setTooLessLocalStorage(): void {
        if (!this.tooLessLocalStorage) {
            this.tooLessLocalStorage = true;
            this.banner.addBanner({ type: 'tooLessLocalStorage' });
        }
    }
}
