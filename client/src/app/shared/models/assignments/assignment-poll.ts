import { AssignmentPollMethod } from 'app/site/assignments/services/assignment-poll.service';
import { AssignmentPollOption } from './assignment-poll-option';
import { BaseModel } from '../base/base-model';

export interface AssignmentPollWithoutNestedModels extends BaseModel<AssignmentPoll> {
    id: number;
    pollmethod: AssignmentPollMethod;
    description: string;
    published: boolean;
    votesvalid: number;
    votesno: number;
    votesabstain: number;
    votesinvalid: number;
    votescast: number;
    has_votes: boolean;
    assignment_id: number;
}

/**
 * Content of the 'polls' property of assignments
 * @ignore
 */
export class AssignmentPoll extends BaseModel<AssignmentPoll> {
    public static COLLECTIONSTRING = 'assignments/assignment-poll';
    private static DECIMAL_FIELDS = ['votesvalid', 'votesinvalid', 'votescast', 'votesno', 'votesabstain'];

    public id: number;
    public options: AssignmentPollOption[];

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
export interface AssignmentPoll extends AssignmentPollWithoutNestedModels {}
