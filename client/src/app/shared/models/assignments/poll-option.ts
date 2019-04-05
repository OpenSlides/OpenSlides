import { Deserializer } from '../base/deserializer';
import { PollVoteValue } from 'app/core/ui-services/poll.service';

/**
 * Representation of a poll option
 *
 * part of the 'polls-options'-array in poll
 * @ignore
 */
export class PollOption extends Deserializer {
    public id: number; // The AssignmentUser id of the candidate
    public candidate_id: number; // the User id of the candidate
    public is_elected: boolean;
    public votes: {
        weight: number; // TODO arrives as string?
        value: PollVoteValue;
    }[];
    public poll_id: number;
    public weight: number; // weight to order the display

    /**
     * Needs to be completely optional because poll has (yet) the optional parameter 'poll-options'
     *
     * @param input
     */
    public constructor(input?: any) {
        // cast stringify numbers
        if (typeof input === 'object') {
            Object.keys(input).forEach(key => {
                if (typeof input[key] === 'string') {
                    input[key] = parseInt(input[key], 10);
                }
            });
            if (input.votes) {
                input.votes = input.votes.map(vote => {
                    return {
                        value: vote.value,
                        weight: parseInt(vote.weight, 10)
                    };
                });
            }
        }
        super(input);
    }
}
