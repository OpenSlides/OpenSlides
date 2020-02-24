import { BasePoll, PercentBase, PollType } from 'app/shared/models/poll/base-poll';
import { ViewAssignmentOption } from 'app/site/assignments/models/view-assignment-option';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewMotionOption } from 'app/site/motions/models/view-motion-option';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ViewUser } from 'app/site/users/models/view-user';

export enum PollClassType {
    Motion = 'motion',
    Assignment = 'assignment'
}

/**
 * Interface describes the possible data for the result-table.
 */
export interface PollTableData {
    votingOption: string;
    votingOptionSubtitle?: string;
    value: VotingResult[];
}

export interface VotingResult {
    vote?: 'yes' | 'no' | 'abstain' | 'votesvalid' | 'votesinvalid' | 'votescast';
    amount?: number;
    icon?: string;
    hide?: boolean;
    showPercent?: boolean;
}

export const PollClassTypeVerbose = {
    motion: 'Motion poll',
    assignment: 'Assignment poll'
};

export const PollStateVerbose = {
    1: 'Created',
    2: 'Started',
    3: 'Finished (unpublished)',
    4: 'Published'
};

export const PollStateChangeActionVerbose = {
    1: 'Reset',
    2: 'Start voting',
    3: 'Stop voting',
    4: 'Publish'
};

export const PollTypeVerbose = {
    analog: 'Analog voting',
    named: 'Named voting',
    pseudoanonymous: 'Pseudoanonymous voting'
};

export const PollPropertyVerbose = {
    majority_method: 'Required majority',
    onehundred_percent_base: '100% base',
    type: 'Poll type',
    pollmethod: 'Poll method',
    state: 'State',
    groups: 'Entitled to vote',
    votes_amount: 'Amount of votes',
    global_no: 'Enable global no',
    global_abstain: 'Enable global abstain'
};

export const MajorityMethodVerbose = {
    simple: 'Simple majority',
    two_thirds: 'Two-thirds majority',
    three_quarters: 'Three-quarters majority',
    disabled: 'Disabled'
};

/**
 * TODO: These need to be in order
 */
export const PercentBaseVerbose = {
    YN: 'Yes/No',
    YNA: 'Yes/No/Abstain',
    valid: 'Valid votes',
    cast: 'Total votes cast',
    disabled: 'Disabled'
};

export abstract class ViewBasePoll<M extends BasePoll<M, any> = any> extends BaseProjectableViewModel<M> {
    private _tableData: PollTableData[] = [];

    protected voteTableKeys: VotingResult[] = [
        {
            vote: 'yes',
            icon: 'thumb_up',
            showPercent: true
        },
        {
            vote: 'no',
            icon: 'thumb_down',
            showPercent: true
        },
        {
            vote: 'abstain',
            icon: 'trip_origin',
            showPercent: this.showAbstainPercent
        }
    ];

    protected sumTableKeys: VotingResult[] = [
        {
            vote: 'votesvalid',
            showPercent: this.poll.isPercentBaseValidOrCast
        },
        {
            vote: 'votesinvalid',
            hide: this.poll.type !== PollType.Analog,
            showPercent: this.poll.isPercentBaseValidOrCast
        },
        {
            vote: 'votescast',
            hide: this.poll.type !== PollType.Analog,
            showPercent: this.poll.isPercentBaseValidOrCast
        }
    ];

    public get tableData(): PollTableData[] {
        if (!this._tableData.length) {
            this._tableData = this.generateTableData();
        }
        return this._tableData;
    }

    public get poll(): M {
        return this._model;
    }

    public get pollClassTypeVerbose(): string {
        return PollClassTypeVerbose[this.pollClassType];
    }

    public get parentLink(): string {
        return `/${this.pollClassType}s/${this.getContentObject().id}`;
    }

    public get stateVerbose(): string {
        return PollStateVerbose[this.state];
    }

    public get nextStateActionVerbose(): string {
        return PollStateChangeActionVerbose[this.nextState];
    }

    public get typeVerbose(): string {
        return PollTypeVerbose[this.type];
    }

    public get majorityMethodVerbose(): string {
        return MajorityMethodVerbose[this.majority_method];
    }

    public get percentBaseVerbose(): string {
        return PercentBaseVerbose[this.onehundred_percent_base];
    }

    public get showAbstainPercent(): boolean {
        return this.onehundred_percent_base === PercentBase.YNA;
    }

    public abstract readonly pollClassType: 'motion' | 'assignment';

    public canBeVotedFor: () => boolean;

    public get user_has_voted_invalid(): boolean {
        return this.options.some(option => option.user_has_voted) && !this.user_has_voted_valid;
    }

    public get user_has_voted_valid(): boolean {
        return this.options.every(option => option.user_has_voted);
    }

    public get user_has_not_voted(): boolean {
        return this.options.every(option => !option.user_has_voted);
    }

    public abstract getSlide(): ProjectorElementBuildDeskriptor;

    public abstract getContentObject(): BaseViewModel;

    public abstract generateTableData(): PollTableData[];
}

export interface ViewBasePoll<M extends BasePoll<M, any> = any> extends BasePoll<M, any> {
    voted: ViewUser[];
    groups: ViewGroup[];
    options: (ViewMotionOption | ViewAssignmentOption)[]; // TODO find a better solution. but works for the moment
}
