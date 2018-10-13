import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material';

/**
 * A custom DateAdapter for the datetimepicker in the config. This is still not fully working and needs to be done later.
 * See comments in PR #3895.
 */
@Injectable()
export class OpenSlidesDateAdapter extends NativeDateAdapter {
    public format(date: Date, displayFormat: Object): string {
        if (displayFormat === 'input') {
            return this.toFullIso8601(date);
        } else {
            return date.toDateString();
        }
    }

    private to2digit(n: number): string {
        return ('00' + n).slice(-2);
    }

    public toFullIso8601(date: Date): string {
        return (
            [date.getUTCFullYear(), this.to2digit(date.getUTCMonth() + 1), this.to2digit(date.getUTCDate())].join('-') +
            'T' +
            [this.to2digit(date.getUTCHours()), this.to2digit(date.getUTCMinutes())].join(':')
        );
    }
}
