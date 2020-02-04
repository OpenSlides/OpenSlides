import { Pipe, PipeTransform } from '@angular/core';

import { ViewBasePoll } from 'app/site/polls/models/view-base-poll';

/**
 * Uses a number and a ViewPoll-object.
 * Converts the number to the voting percent base using the
 * given 100%-Base option in the poll object
 *
 * returns null if a percent calculation is not possible
 * or the result is 0
 *
 * @example
 * ```html
 * <span> {{ voteYes | pollPercentBase: poll }} </span>
 * ```
 */
@Pipe({
    name: 'pollPercentBase'
})
export class PollPercentBasePipe implements PipeTransform {
    private decimalPlaces = 3;

    public transform(value: number, viewPoll: ViewBasePoll): string | null {
        const totalByBase = viewPoll.getPercentBase();

        if (totalByBase) {
            const percentNumber = (value / totalByBase) * 100;
            if (percentNumber > 0) {
                const result = percentNumber % 1 === 0 ? percentNumber : percentNumber.toFixed(this.decimalPlaces);
                return `(${result}%)`;
            }
        }
        return null;
    }
}
