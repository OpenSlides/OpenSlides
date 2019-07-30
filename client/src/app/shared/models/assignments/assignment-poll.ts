import { AssignmentPollMethod } from 'app/site/assignments/services/assignment-poll.service';
import { AssignmentPollOption } from './assignment-poll-option';
import { BaseModel } from '../base/base-model';

/**
 * Content of the 'polls' property of assignments
 * @ignore
 */
export class AssignmentPoll extends BaseModel<AssignmentPoll> {
    public static COLLECTIONSTRING = 'assignments/assignment-poll';
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
        super(AssignmentPoll.COLLECTIONSTRING, input);
    }
}
