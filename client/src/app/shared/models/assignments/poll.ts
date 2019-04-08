import { AssignmentPollMethod } from 'app/site/assignments/services/assignment-poll.service';
import { Deserializer } from '../base/deserializer';
import { PollOption } from './poll-option';

/**
 * Content of the 'polls' property of assignments
 * @ignore
 */
export class Poll extends Deserializer {
    public id: number;
    public pollmethod: AssignmentPollMethod;
    public description: string;
    public published: boolean;
    public options: PollOption[];
    public votesvalid: number;
    public votesinvalid: number;
    public votescast: number;
    public has_votes: boolean;
    public assignment_id: number;

    /**
     * (temporary?) storing the base values for percentage calculations,
     * to avoid recalculating pollBases too often
     * (the calculation iterates through all pollOptions in some use cases)
     */
    public pollBase: number;

    /**
     * Needs to be completely optional because assignment has (yet) the optional parameter 'polls'
     * @param input
     */
    public constructor(input?: any) {
        // cast stringify numbers
        if (typeof input === 'object') {
            const numberifyKeys = ['id', 'votesvalid', 'votesinvalid', 'votescast', 'assignment_id'];

            for (const key of Object.keys(input)) {
                if (numberifyKeys.includes(key) && typeof input[key] === 'string') {
                    input[key] = parseInt(input[key], 10);
                }
            }
        }
        super(input);
    }

    public deserialize(input: any): void {
        Object.assign(this, input);
        this.options = [];
        if (input.options instanceof Array) {
            this.options = input.options.map(pollOptionData => new PollOption(pollOptionData));
        }
    }
}
