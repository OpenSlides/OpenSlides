import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

/**
 * Determine the progress mode
 */
export type ProgressMode = 'determinate' | 'indeterminate' | 'buffer' | 'query';

/**
 * Shape of the progress info
 */
export interface ProgressInfo {
    mode: ProgressMode;
    text?: string;
}

/**
 * Helper service to announce some sort of progress, determinate or indeterminate.
 */
@Injectable({
    providedIn: 'root'
})
export class ProgressService {
    /**
     * Subject to get progress information
     */
    private _progressInfo: Subject<ProgressInfo> = new Subject();

    /**
     * Subject to get the progress amount
     */
    private _progressAmount: Subject<number> = new Subject();

    /**
     * Get the progress information as observable
     */
    public get info(): Subject<ProgressInfo> {
        return this._progressInfo;
    }

    /**
     * Get the progres amount as observable
     */
    public get amount(): Subject<number> {
        return this._progressAmount;
    }

    /**
     * Set the progress info. Usually only required once for every part if new information
     */
    public set progressInfo(newInfo: ProgressInfo) {
        setTimeout(() => this._progressInfo.next(newInfo));
    }

    /**
     * Set the new progress amount. Can be called whenever new info about the progress
     * is available. Required only if the ProgressMode is set to 'determinate'
     */
    public set progressAmount(newAmount: number) {
        this._progressAmount.next(newAmount);
    }
}
