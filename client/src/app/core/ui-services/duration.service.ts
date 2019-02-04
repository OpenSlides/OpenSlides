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
 * // will result in 0
 * const c = this.durationService.stringToDuration('01:10b');
 * ```
 *
 * @example
 * ```ts
 * // will result in 01:10 h
 * const a = this.durationService.durationToString(70);
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
     * Transform a duration string to duration in minutes.
     *
     * @param durationText the text to be transformed into a duration
     * @returns time in minutes or 0 if values are below 0 or no parsable numbers
     */
    public stringToDuration(durationText: string): number {
        const splitDuration = durationText.replace('h', '').split(':');
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
     * Converts a duration number (given in minutes)
     * To a string in HH:MM format
     *
     * @param duration value in minutes
     * @returns a more human readable time representation
     */
    public durationToString(duration: number): string {
        const hours = Math.floor(duration / 60);
        const minutes = `0${Math.floor(duration - hours * 60)}`.slice(-2);
        if (!isNaN(+hours) && !isNaN(+minutes)) {
            return `${hours}:${minutes} h`;
        } else {
            return '';
        }
    }

    /**
     * Converts a duration number (given in seconds)o a string in `MMM:SS` format
     *
     * @param time value in seconds
     * @returns a more human readable time representation
     */
    public secondDurationToString(time: number): string {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${`0${seconds}`.slice(-2)}`;
    }
}
