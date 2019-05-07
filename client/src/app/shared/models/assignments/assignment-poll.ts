import { AssignmentPollMethod } from 'app/site/assignments/services/assignment-poll.service';
import { Deserializer } from '../base/deserializer';
import { AssignmentPollOption } from './assignment-poll-option';

/**
 * Content of the 'polls' property of assignments
 * @ignore
 */
export class AssignmentPoll extends Deserializer {
    private static DECIMAL_FIELDS = ['votesvalid', 'votesinvalid', 'votescast', 'votesno', 'votesabstain'];

    public id: number;
    public pollmethod: AssignmentPollMethod;
    public description: string;
    public published: boolean;
    public options: AssignmentPollOption[];
    public votesvalid: number;
    public votesno: number;
    public votesabstain: number;
    public votesinvalid: number;
    public votescast: number;
    public has_votes: boolean;
    public assignment_id: number;

    /**
     * Needs to be completely optional because assignment has (yet) the optional parameter 'polls'
     * @param input
     */
    public constructor(input?: any) {
        // cast stringify numbers
        if (input) {
            AssignmentPoll.DECIMAL_FIELDS.forEach(field => {
                if (input[field] && typeof input[field] === 'string') {
                    input[field] = parseFloat(input[field]);
                }
            });
        }
        super(input);
    }

    public deserialize(input: any): void {
        Object.assign(this, input);
        this.options = [];
        if (input.options instanceof Array) {
            this.options = input.options.map(pollOptionData => new AssignmentPollOption(pollOptionData));
        }
    }
}
