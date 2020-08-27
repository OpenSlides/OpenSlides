import { Injectable } from '@angular/core';

import { PollState, PollType } from 'app/shared/models/poll/base-poll';
import { ViewBasePoll } from 'app/site/polls/models/view-base-poll';
import { OperatorService } from '../core-services/operator.service';

export enum VotingError {
    POLL_WRONG_STATE = 1, // 1 so we can check with negation
    POLL_WRONG_TYPE,
    USER_HAS_NO_PERMISSION,
    USER_IS_ANONYMOUS,
    USER_NOT_PRESENT
}

/**
 * TODO: It appears that the only message that makes sense for the user to see it the last one.
 */
export const VotingErrorVerbose = {
    1: "You can't vote on this poll right now because it's not in the 'Started' state.",
    2: "You can't vote on this poll because its type is set to analog voting.",
    3: "You don't have permission to vote on this poll.",
    4: 'You have to be logged in to be able to vote.',
    5: 'You have to be present to vote on a poll.',
    6: "You have already voted on this poll. You can't change your vote in a pseudoanonymous poll."
};

@Injectable({
    providedIn: 'root'
})
export class VotingService {
    public constructor(private operator: OperatorService) {}

    /**
     * checks whether the operator can vote on the given poll
     */
    public canVote(poll: ViewBasePoll): boolean {
        const error = this.getVotePermissionError(poll);
        return !error;
    }

    /**
     * checks whether the operator can vote on the given poll
     * @returns null if no errors exist (= user can vote) or else a VotingError
     */
    public getVotePermissionError(poll: ViewBasePoll): VotingError | void {
        if (this.operator.isAnonymous) {
            return VotingError.USER_IS_ANONYMOUS;
        }

        const user = this.operator.user;
        if (!poll.groups_id.intersect(user.groups_id).length) {
            return VotingError.USER_HAS_NO_PERMISSION;
        }
        if (poll.type === PollType.Analog) {
            return VotingError.POLL_WRONG_TYPE;
        }
        if (poll.state !== PollState.Started) {
            return VotingError.POLL_WRONG_STATE;
        }
        if (!user.is_present) {
            return VotingError.USER_NOT_PRESENT;
        }
    }

    public getVotePermissionErrorVerbose(poll: ViewBasePoll): string | void {
        const error = this.getVotePermissionError(poll);
        if (error) {
            return VotingErrorVerbose[error];
        }
    }
}
