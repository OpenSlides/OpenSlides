import { Injectable } from '@angular/core';

/**
 * Helper service to convert numbers to time representation
 * and vice versa
 *
 * @example
 * ```ts
 * // will result in 70
 * const a = this.durationService.stringToDuration('01:10h');
 *
 * // will also result in 70
 * const b = this.durationService.stringToDuration('01:10');
 *
 * // will also result in 89 (interpret as seconds)
 * const b = this.durationService.stringToDuration('01:20 m', 'm');
 *
 * // will result in 0
 * const c = this.durationService.stringToDuration('01:10b');
 * ```
 *
 * @example
 * ```ts
 * // will result in 01:10 h
 * const a = this.durationService.durationToString(70);
 *
 * // will result in 00:30 m (30 is interpreted as seconds)
 * const a = this.durationService.durationToString(30);
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class DurationService {
    /**
     * Constructor
     */
    public constructor() {}

    /**
     * Transform a duration string to duration in minutes or seconds. This depends on the
     * provided suffix for the input.
     *
     * @param durationText the text to be transformed into a duration
     * @param suffix may be 'h' or 'm' for hour or minute. This character will be removed
     * from the duration text.
     * @returns time in minutes or seconds or 0 if values are below 0 or no parsable numbers
     */
    public stringToDuration(durationText: string, suffix: 'h' | 'm' = 'h'): number {
        const splitDuration = durationText.replace(suffix, '').split(':');
        let time: number;
        if (splitDuration.length > 1 && !isNaN(+splitDuration[0]) && !isNaN(+splitDuration[1])) {
            time = +splitDuration[0] * 60 + +splitDuration[1];
        } else if (splitDuration.length === 1 && !isNaN(+splitDuration[0])) {
            time = +splitDuration[0];
        }

        if (!time || time < 0) {
            time = 0;
        }

        return time;
    }

    /**
     * Converts a duration number (given in minutes or seconds)
     *
     * @param duration value in minutes
     * @returns a more human readable time representation
     */
    public durationToString(duration: number, suffix: 'h' | 'm' = 'h'): string {
        const major = Math.floor(duration / 60);
        const minor = `0${duration % 60}`.slice(-2);
        if (!isNaN(+major) && !isNaN(+minor)) {
            return `${major}:${minor} ${suffix}`;
        } else {
            return '';
        }
    }
}
