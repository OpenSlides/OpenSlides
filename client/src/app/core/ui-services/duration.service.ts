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
 * const a = this.durationService.durationToString(70, 'h');
 *
 * // will result in 00:30 m (30 is interpreted as seconds)
 * const a = this.durationService.durationToString(30, 'm');
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
     * Calculates a given time to a readable string, that contains hours, minutes and seconds.
     *
     * @param duration The time as number (in seconds).
     *
     * @returns A readable time-string.
     */
    public durationToStringWithHours(duration: number): string {
        const hours = Math.floor(duration / 3600);
        const minutes = `0${Math.floor((duration % 3600) / 60)}`.slice(-2);
        const seconds = `0${Math.floor(duration % 60)}`.slice(-2);
        if (!isNaN(+minutes) && !isNaN(+seconds)) {
            return `${hours}:${minutes}:${seconds} h`;
        } else {
            return '';
        }
    }

    /**
     * Converts a duration number (given in minutes or seconds)
     *
     * @param duration value in minutes or seconds (60 units being the next bigger unit)
     * @param suffix any suffix to add.
     * @returns a more human readable time representation
     */
    public durationToString(duration: number, suffix: 'h' | 'm'): string {
        const negative = duration < 0;
        const major = negative ? Math.ceil(duration / 60) : Math.floor(duration / 60);
        const minor = `0${Math.abs(duration) % 60}`.slice(-2);
        if (!isNaN(+major) && !isNaN(+minor) && suffix) {
            // converting the number '-0' to string results in '0', depending on the browser.
            return `${major === 0 && negative ? '-' + Math.abs(major) : major}:${minor} ${suffix}`;
        } else {
            return '';
        }
    }
}
