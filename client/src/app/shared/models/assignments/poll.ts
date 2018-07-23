import { PollOption } from './poll-option';
import { Deserializable } from '../deserializable.model';

/**
 * Content of the 'polls' property of assignments
 * @ignore
 */
export class Poll implements Deserializable {
    id: number;
    pollmethod: string;
    description: string;
    published: boolean;
    options: PollOption[];
    votesvalid: number;
    votesinvalid: number;
    votescast: number;
    has_votes: boolean;
    assignment_id: number;

    /**
     * Needs to be completely optional because assignment has (yet) the optional parameter 'polls'
     * @param id
     * @param pollmethod
     * @param description
     * @param published
     * @param options
     * @param votesvalid
     * @param votesinvalid
     * @param votescast
     * @param has_votes
     * @param assignment_id
     */
    constructor(
        id?: number,
        pollmethod?: string,
        description?: string,
        published?: boolean,
        options?: PollOption[],
        votesvalid?: number,
        votesinvalid?: number,
        votescast?: number,
        has_votes?: boolean,
        assignment_id?: number
    ) {
        this.id = id;
        this.pollmethod = pollmethod;
        this.description = description;
        this.published = published;
        this.options = options || Array(new PollOption()); //TODO Array
        this.votesvalid = votesvalid;
        this.votesinvalid = votesinvalid;
        this.votescast = votescast;
        this.has_votes = has_votes;
        this.assignment_id = assignment_id;
    }

    deserialize(input: any): this {
        Object.assign(this, input);

        if (input.options instanceof Array) {
            this.options = [];
            input.options.forEach(pollOptionData => {
                this.options.push(new PollOption().deserialize(pollOptionData));
            });
        }
        return this;
    }
}
