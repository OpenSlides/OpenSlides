import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats floats to have a defined precision.
 *
 * In this default application, the precision is 0, so no decimal places. Plugins
 * may override this pipe to enable more precise votes.
 */
@Pipe({
    name: 'precisionPipe'
})
export class PrecisionPipe implements PipeTransform {
    protected precision: number;

    public constructor(private decimalPipe: DecimalPipe) {
        this.precision = 0;
    }

    public transform(value: number, precision?: number): string {
        if (!precision) {
            precision = this.precision;
        }

        /**
         * Min 1 place before the comma and exactly precision places after.
         */
        const digitsInfo = `1.${precision}-${precision}`;
        return this.decimalPipe.transform(value, digitsInfo);
    }
}
