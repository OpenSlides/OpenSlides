import { Pipe, PipeTransform } from '@angular/core';

import { AssignmentPollService } from 'app/site/assignments/modules/assignment-poll/services/assignment-poll.service';
import { MotionPollService } from 'app/site/motions/services/motion-poll.service';
import { PollData } from 'app/site/polls/services/poll.service';
import { PollDataOption, PollTableData } from '../../site/polls/services/poll.service';

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
 * <span> {{ voteYes | pollPercentBase: poll:'assignment' }} </span>
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

    public transform(
        value: number,
        poll: PollData,
        row: PollDataOption | PollTableData,
        type: 'motion' | 'assignment'
    ): string | null {
        // logic handles over the pollService to avoid circular dependencies
        let voteValueInPercent: string;

        /**
         * PollData has not enough explicit information to simply guess the type correctly.
         * This should not be a problem when PollData is a real model or a real type. Since
         * we cannot expect the projector to work with real types for now, we need to provice the type
         */
        if (type === 'assignment') {
            voteValueInPercent = this.assignmentPollService.getVoteValueInPercent(value, { poll, row });
        } else {
            voteValueInPercent = this.motionPollService.getVoteValueInPercent(value, { poll, row });
        }

        if (voteValueInPercent) {
            return `(${voteValueInPercent})`;
        } else {
            return null;
        }
    }
}
