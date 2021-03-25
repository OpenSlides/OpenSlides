import { CalculablePollKey } from 'app/site/polls/services/poll.service';
import { AssignmentOption } from './assignment-option';
import { BasePoll } from '../poll/base-poll';

export enum AssignmentPollMethod {
    Y = 'Y',
    YN = 'YN',
    YNA = 'YNA',
    N = 'N'
}

export enum AssignmentPollPercentBase {
    Y = 'Y',
    YN = 'YN',
    YNA = 'YNA',
    Valid = 'valid',
    Cast = 'cast',
    Entitled = 'entitled',
    Disabled = 'disabled'
}

/**
 * Class representing a poll for an assignment.
 */
export class AssignmentPoll extends BasePoll<
    AssignmentPoll,
    AssignmentOption,
    AssignmentPollMethod,
    AssignmentPollPercentBase
> {
    public static COLLECTIONSTRING = 'assignments/assignment-poll';
    public static defaultGroupsConfig = 'assignment_poll_default_groups';
    public static defaultPollMethodConfig = 'assignment_poll_method';
    public static DECIMAL_FIELDS = [
        'votesvalid',
        'votesinvalid',
        'votescast',
        'amount_global_yes',
        'amount_global_no',
        'amount_global_abstain'
    ];

    public id: number;
    public assignment_id: number;
    public min_votes_amount: number;
    public max_votes_amount: number;
    public allow_multiple_votes_per_candidate: boolean;
    public global_yes: boolean;
    public global_no: boolean;
    public global_abstain: boolean;
    public amount_global_yes: number;
    public amount_global_no: number;
    public amount_global_abstain: number;
    public description: string;

    public get isMethodY(): boolean {
        return this.pollmethod === AssignmentPollMethod.Y;
    }

    public get isMethodN(): boolean {
        return this.pollmethod === AssignmentPollMethod.N;
    }

    public get isMethodYN(): boolean {
        return this.pollmethod === AssignmentPollMethod.YN;
    }

    public get isMethodYNA(): boolean {
        return this.pollmethod === AssignmentPollMethod.YNA;
    }

    public get hasGlobalOption(): boolean {
        return this.global_yes || this.global_no || this.global_abstain;
    }

    public get pollmethodFields(): CalculablePollKey[] {
        if (this.pollmethod === AssignmentPollMethod.YN) {
            return ['yes', 'no'];
        } else if (this.pollmethod === AssignmentPollMethod.YNA) {
            return ['yes', 'no', 'abstain'];
        } else if (this.pollmethod === AssignmentPollMethod.Y) {
            return ['yes'];
        }
    }

    public constructor(input?: any) {
        super(AssignmentPoll.COLLECTIONSTRING, input);
    }

    protected getDecimalFields(): string[] {
        return AssignmentPoll.DECIMAL_FIELDS;
    }
}
