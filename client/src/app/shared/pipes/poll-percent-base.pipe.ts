import { Pipe, PipeTransform } from '@angular/core';

import { AssignmentPollService } from 'app/site/assignments/services/assignment-poll.service';
import { MotionPollService } from 'app/site/motions/services/motion-poll.service';
import { PollData } from 'app/site/polls/services/poll.service';

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

    public constructor(
        private assignmentPollService: AssignmentPollService,
        private motionPollService: MotionPollService
    ) {}

    public transform(value: number, poll: PollData): string | null {
        let totalByBase: number;
        if ((<any>poll).assignment) {
            totalByBase = this.assignmentPollService.getPercentBase(poll);
        } else {
            totalByBase = this.motionPollService.getPercentBase(poll);
        }

        if (totalByBase && totalByBase > 0) {
            const percentNumber = (value / totalByBase) * 100;
            const result = percentNumber % 1 === 0 ? percentNumber : percentNumber.toFixed(this.decimalPlaces);
            return `(${result} %)`;
        }
        return null;
    }
}
