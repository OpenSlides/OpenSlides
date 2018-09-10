import { Deserializer } from '../deserializer.model';

/**
 * Representation of a poll option
 *
 * part of the 'polls-options'-array in poll
 * @ignore
 */
export class PollOption extends Deserializer {
    public id: number;
    public candidate_id: number;
    public is_elected: boolean;
    public votes: number[];
    public poll_id: number;
    public weight: number;

    /**
     * Needs to be completely optional because poll has (yet) the optional parameter 'poll-options'
     * @param input
     */
    public constructor(input?: any) {
        super(input);
    }
}
