import { Deserializable } from '../deserializable.model';

/**
 * Representation of a poll option
 *
 * part of the 'polls-options'-array in poll
 * @ignore
 */
export class PollOption implements Deserializable {
    id: number;
    candidate_id: number;
    is_elected: boolean;
    votes: number[];
    poll_id: number;
    weight: number;

    /**
     * Needs to be completely optional because poll has (yet) the optional parameter 'poll-options'
     * @param id
     * @param candidate_id
     * @param is_elected
     * @param votes
     * @param poll_id
     * @param weight
     */
    constructor(
        id?: number,
        candidate_id?: number,
        is_elected?: boolean,
        votes?: number[],
        poll_id?: number,
        weight?: number
    ) {
        this.id = id;
        this.candidate_id = candidate_id;
        this.is_elected = is_elected;
        this.votes = votes;
        this.poll_id = poll_id;
        this.weight = weight;
    }

    deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}
