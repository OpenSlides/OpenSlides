import { AssignmentOption } from './assignment-option';
import { BasePoll } from '../poll/base-poll';

export enum AssignmentPollMethods {
    YN = 'YN',
    YNA = 'YNA',
    Votes = 'votes'
}

/**
 * Content of the 'polls' property of assignments
 * @ignore
 */
export class AssignmentPoll extends BasePoll<AssignmentPoll, AssignmentOption> {
    public static COLLECTIONSTRING = 'assignments/assignment-poll';

    public id: number;
    public assignment_id: number;
    public pollmethod: AssignmentPollMethods;
    public votes_amount: number;
    public allow_multiple_votes_per_candidate: boolean;
    public global_no: boolean;
    public global_abstain: boolean;
    public description: string;

    public constructor(input?: any) {
        super(AssignmentPoll.COLLECTIONSTRING, input);
    }
}
