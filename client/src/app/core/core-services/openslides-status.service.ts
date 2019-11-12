import { Injectable } from '@angular/core';

import { History } from 'app/shared/models/core/history';
import { BannerDefinition, BannerService } from '../ui-services/banner.service';

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
    private bannerDefinition: BannerDefinition = {
        type: 'history'
    };

    /**
     * Returns, if OpenSlides is in the history mode.
     */
    public get isInHistoryMode(): boolean {
        return !!this.history;
    }

    public isPrioritizedClient = false;

    /**
     * Ctor, does nothing.
     */
    public constructor(private banner: BannerService) {}

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
        this.banner.addBanner(this.bannerDefinition);
    }

    /**
     * Leaves the history mode
     */
    public leaveHistoryMode(): void {
        this.history = null;
        this.banner.removeBanner(this.bannerDefinition);
    }
}
