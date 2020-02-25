import { BasePoll, PercentBase, PollType } from 'app/shared/models/poll/base-poll';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewBaseOption } from './view-base-option';

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
    1: 'created',
    2: 'started',
    3: 'finished (unpublished)',
    4: 'published'
};

export const PollStateChangeActionVerbose = {
    1: 'Reset',
    2: 'Start voting',
    3: 'Stop voting',
    4: 'Publish'
};

export const PollTypeVerbose = {
    analog: 'analog',
    named: 'nominal',
    pseudoanonymous: 'non-nominal'
};

export const PollPropertyVerbose = {
    majority_method: 'Required majority',
    onehundred_percent_base: '100% base',
    type: 'Voting type',
    pollmethod: 'Voting method',
    state: 'State',
    groups: 'Entitled to vote',
    votes_amount: 'Amount of votes',
    global_no: 'general "No"',
    global_abstain: 'general "Abstain"'
};

export const MajorityMethodVerbose = {
    simple: 'Simple majority',
    two_thirds: 'Two-thirds majority',
    three_quarters: 'Three-quarters majority',
    disabled: 'Disabled'
};

export const PercentBaseVerbose = {
    YN: 'Yes/No',
    YNA: 'Yes/No/Abstain',
    valid: 'Valid votes',
    cast: 'Total votes cast',
    disabled: 'Disabled'
};

export abstract class ViewBasePoll<
    M extends BasePoll<M, any, PM, PB> = any,
    PM extends string = string,
    PB extends string = string
> extends BaseProjectableViewModel<M> {
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

    public abstract get pollmethodVerbose(): string;

    public abstract get percentBaseVerbose(): string;

    public get showAbstainPercent(): boolean {
        return this.onehundred_percent_base === PercentBase.YNA;
    }

    public abstract readonly pollClassType: PollClassType;

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

export interface ViewBasePoll<
    M extends BasePoll<M, any, PM, PB> = any,
    PM extends string = string,
    PB extends string = string
> extends BasePoll<M, any, PM, PB> {
    voted: ViewUser[];
    groups: ViewGroup[];
    options: ViewBaseOption[];
}
