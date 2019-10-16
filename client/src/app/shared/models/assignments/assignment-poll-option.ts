import { PollVoteValue } from 'app/core/ui-services/poll.service';
import { BaseModel } from '../base/base-model';

export interface AssignmentOptionVote {
    weight: number;
    value: PollVoteValue;
}

/**
 * Representation of a poll option
 *
 * part of the 'polls-options'-array in poll
 * @ignore
 */
export class AssignmentPollOption extends BaseModel<AssignmentPollOption> {
    public static COLLECTIONSTRING = 'assignments/assignment-poll-option';

    public id: number; // The AssignmentPollOption id
    public candidate_id: number; // the user id of the candidate
    public is_elected: boolean;
    public votes: AssignmentOptionVote[];
    public poll_id: number;
    public weight: number; // weight to order the display

    /**
     * @param input
     */
    public constructor(input?: any) {
        if (input && input.votes) {
            input.votes.forEach(vote => {
                if (vote.weight) {
                    vote.weight = parseFloat(vote.weight);
                }
            });
        }
        super(AssignmentPollOption.COLLECTIONSTRING, input);
    }
}
