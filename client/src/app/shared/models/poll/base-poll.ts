import { BaseDecimalModel } from '../base/base-decimal-model';
import { BaseOption } from './base-option';

export enum PollColor {
    yes = '#4caf50',
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

export enum PollType {
    Analog = 'analog',
    Named = 'named',
    Pseudoanonymous = 'pseudoanonymous'
}

export enum MajorityMethod {
    Simple = 'simple',
    TwoThirds = 'two_thirds',
    ThreeQuarters = 'three_quarters',
    Disabled = 'disabled'
}

export enum PercentBase {
    YN = 'YN',
    YNA = 'YNA',
    Valid = 'valid',
    Cast = 'cast',
    Entitled = 'entitled',
    Disabled = 'disabled'
}

export interface EntitledUsersEntry {
    user_id: number;
    voted: boolean;
    vote_delegated_to_id?: number;
}

export const VOTE_MAJORITY = -1;
export const VOTE_UNDOCUMENTED = -2;
export const LOWEST_VOTE_VALUE = VOTE_UNDOCUMENTED;

export abstract class BasePoll<
    T = any,
    O extends BaseOption<any> = any,
    PM extends string = string,
    PB extends string = string
> extends BaseDecimalModel<T> {
    public state: PollState;
    public type: PollType;
    public title: string;
    public votesvalid: number;
    public votesinvalid: number;
    public votescast: number;
    public groups_id: number[];
    public majority_method: MajorityMethod;
    public voted_id: number[];
    public user_has_voted: boolean;
    public user_has_voted_for_delegations: number[];
    public pollmethod: PM;
    public onehundred_percent_base: PB;
    public is_pseudoanonymized: boolean;
    public entitled_users_at_stop: EntitledUsersEntry[];

    public get isCreated(): boolean {
        return this.state === PollState.Created;
    }

    public get isStarted(): boolean {
        return this.state === PollState.Started;
    }

    public get isFinished(): boolean {
        return this.state === PollState.Finished;
    }

    public get isPublished(): boolean {
        return this.state === PollState.Published;
    }

    public get isPercentBaseCast(): boolean {
        return this.onehundred_percent_base === PercentBase.Cast;
    }

    public get isAnalog(): boolean {
        return this.type === PollType.Analog;
    }

    public get isNamed(): boolean {
        return this.type === PollType.Named;
    }

    public get isAnon(): boolean {
        return this.type === PollType.Pseudoanonymous;
    }

    public get isEVoting(): boolean {
        return this.isNamed || this.isAnon;
    }

    /**
     * Determine if the state is finished or published
     */
    public get stateHasVotes(): boolean {
        return this.isFinished || this.isPublished;
    }

    public get nextState(): PollState {
        return this.state + 1;
    }
}
