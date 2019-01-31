import { Injectable } from '@angular/core';

/**
 * Holds information about OpenSlides. This is not included into other services to
 * avoid circular dependencies.
 */
@Injectable({
    providedIn: 'root'
})
export class OpenSlidesStatusService {
    /**
     * Saves, if OpenSlides is in the history mode.
     */
    private historyMode = false;

    /**
     * Returns, if OpenSlides is in the history mode.
     */
    public get isInHistoryMode(): boolean {
        return this.historyMode;
    }

    /**
     * Ctor, does nothing.
     */
    public constructor() {}

    /**
     * Enters the histroy mode
     */
    public enterHistoryMode(): void {
        this.historyMode = true;
    }

    /**
     * Leaves the histroy mode
     */
    public leaveHistroyMode(): void {
        this.historyMode = false;
    }
}
