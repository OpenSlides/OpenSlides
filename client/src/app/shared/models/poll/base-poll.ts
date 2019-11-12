import { BaseDecimalModel } from '../base/base-decimal-model';
import { BaseOption } from './base-option';

export enum PollColors {
    yes = '#9fd773',
    no = '#cc6c5b',
    abstain = '#a6a6a6',
    votesvalid = '#e2e2e2',
    votesinvalid = '#e2e2e2',
    votescast = '#e2e2e2'
}

export enum PollState {
    Created = 1,
    Started,
    Finished,
    Published
}

export const PollStateVerbose = {
    1: 'Created',
    2: 'Started',
    3: 'Finished',
    4: 'Published'
};

export enum PollType {
    Analog = 'analog',
    Named = 'named',
    Pseudoanonymous = 'pseudoanonymous'
}

export const PollTypeVerbose = {
    analog: 'Analog',
    named: 'Named',
    pseudoanonymous: 'Pseudoanonymous'
};

export enum PercentBase {
    YN = 'YN',
    YNA = 'YNA',
    Valid = 'valid',
    Cast = 'cast',
    Disabled = 'disabled'
}

export const PercentBaseVerbose = {
    YN: 'Yes/No',
    YNA: 'Yes/No/Abstain',
    valid: 'Valid votes',
    cast: 'Casted votes',
    disabled: 'Disabled'
};

export enum MajorityMethod {
    Simple = 'simple',
    TwoThirds = 'two_thirds',
    ThreeQuarters = 'three_quarters',
    Disabled = 'disabled'
}

export const MajorityMethodVerbose = {
    simple: 'Simple',
    two_thirds: 'Two Thirds',
    three_quarters: 'Three Quarters',
    disabled: 'Disabled'
};

export const PollPropertyVerbose = {
    majority_method: 'Majority method',
    onehundred_percent_base: '100%-base',
    type: 'Poll type',
    pollmethod: 'Poll method',
    pollState: 'Poll state',
    groups: 'Entitled to vote'
};

export interface BasePollWithoutNestedModels {
    state: PollState;
    type: PollType;
    title: string;
    votesvalid: number;
    votesinvalid: number;
    votescast: number;
    groups_id: number[];
    voted_id: number[];
    majority_method: MajorityMethod;
    onehundred_percent_base: PercentBase;

    // getters from `BasePoll`
    readonly stateVerbose: string;
    readonly typeVerbose: string;
    readonly majorityMethodVerbose: string;
    readonly percentBaseVerbose: string;
}

export abstract class BasePoll<T, O extends BaseOption<any>> extends BaseDecimalModel<T> {
    public options: O[];

    protected getDecimalFields(): (keyof BasePoll<T, O>)[] {
        return ['votesvalid', 'votesinvalid', 'votescast'];
    }

    public get stateVerbose(): string {
        return PollStateVerbose[this.state];
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
}
export interface BasePoll<T, O extends BaseOption<any>> extends BasePollWithoutNestedModels {}
