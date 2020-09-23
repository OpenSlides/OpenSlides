import { Pipe, PipeTransform } from '@angular/core';

import { AssignmentPollService } from 'app/site/assignments/modules/assignment-poll/services/assignment-poll.service';
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
    public constructor(
        private assignmentPollService: AssignmentPollService,
        private motionPollService: MotionPollService
    ) {}

    public transform(value: number, poll: PollData): string | null {
        // logic handles over the pollService to avoid circular dependencies
        let voteValueInPercent: string;
        if ((<any>poll).assignment) {
            voteValueInPercent = this.assignmentPollService.getVoteValueInPercent(value, poll);
        } else {
            voteValueInPercent = this.motionPollService.getVoteValueInPercent(value, poll);
        }

        if (voteValueInPercent) {
            return `(${voteValueInPercent})`;
        } else {
            return null;
        }
    }
}
