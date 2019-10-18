import { AssignmentOption } from './assignment-option';
import { BasePoll, BasePollWithoutNestedModels } from '../poll/base-poll';

export enum AssignmentPollmethods {
    'yn' = 'yn',
    'yna' = 'yna',
    'votes' = 'votes'
}

export interface AssignmentPollWithoutNestedModels extends BasePollWithoutNestedModels {
    pollmethod: AssignmentPollmethods;
    votes_amount: number;
    allow_multiple_votes_per_candidate: boolean;
    global_no: boolean;
    global_abstain: boolean;
    assignment_id: number;
}

/**
 * Content of the 'polls' property of assignments
 * @ignore
 */
export class AssignmentPoll extends BasePoll<AssignmentPoll, AssignmentOption> {
    public static COLLECTIONSTRING = 'assignments/assignment-poll';

    public id: number;

    public constructor(input?: any) {
        super(AssignmentPoll.COLLECTIONSTRING, input);
    }
}
export interface AssignmentPoll extends AssignmentPollWithoutNestedModels {}
