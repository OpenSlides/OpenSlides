import { BasePoll } from 'app/shared/models/poll/base-poll';
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

export const PollClassTypeVerbose = {
    motion: 'Vote',
    assignment: 'Ballot'
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
    global_no: 'General No',
    global_abstain: 'General Abstain'
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

    public get hasVote(): boolean | null {
        if (!this.user_has_voted && this.canBeVotedFor()) {
            return false;
        } else if (this.user_has_voted) {
            return true;
        } else {
            return null;
        }
    }

    public abstract get pollmethodVerbose(): string;

    public abstract get percentBaseVerbose(): string;

    public abstract readonly pollClassType: 'motion' | 'assignment';

    public canBeVotedFor: () => boolean;

    public hasVotedId(userId: number): boolean {
        return this.user_has_voted_for_delegations?.includes(userId);
    }

    public abstract getSlide(): ProjectorElementBuildDeskriptor;

    public abstract getContentObject(): BaseViewModel;
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
