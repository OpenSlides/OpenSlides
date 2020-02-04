import { BaseDecimalModel } from '../base/base-decimal-model';
import { BaseOption } from './base-option';

export enum PollColor {
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

export enum PollType {
    Analog = 'analog',
    Named = 'named',
    Pseudoanonymous = 'pseudoanonymous'
}

export enum PercentBase {
    YN = 'YN',
    YNA = 'YNA',
    Valid = 'valid',
    Cast = 'cast',
    Disabled = 'disabled'
}

export enum MajorityMethod {
    Simple = 'simple',
    TwoThirds = 'two_thirds',
    ThreeQuarters = 'three_quarters',
    Disabled = 'disabled'
}

export abstract class BasePoll<T = any, O extends BaseOption<any> = any> extends BaseDecimalModel<T> {
    public state: PollState;
    public type: PollType;
    public title: string;
    public votesvalid: number;
    public votesinvalid: number;
    public votescast: number;
    public groups_id: number[];
    public voted_id: number[];
    public majority_method: MajorityMethod;
    public onehundred_percent_base: PercentBase;
    public user_has_voted: boolean;

    public get isStateCreated(): boolean {
        return this.state === PollState.Created;
    }

    public get isStateStarted(): boolean {
        return this.state === PollState.Started;
    }

    public get isStateFinished(): boolean {
        return this.state === PollState.Finished;
    }

    public get isStatePublished(): boolean {
        return this.state === PollState.Published;
    }

    public get isPercentBaseValidOrCast(): boolean {
        return this.onehundred_percent_base === PercentBase.Valid || this.onehundred_percent_base === PercentBase.Cast;
    }

    /**
     * If the state is finished.
     */
    public get isFinished(): boolean {
        return this.state === PollState.Finished;
    }

    /**
     * If the state is published.
     */
    public get isPublished(): boolean {
        return this.state === PollState.Published;
    }

    /**
     * Determine if the state is finished or published
     */
    public get stateHasVotes(): boolean {
        return this.isFinished || this.isPublished;
    }

    protected getDecimalFields(): (keyof BasePoll<T, O>)[] {
        return ['votesvalid', 'votesinvalid', 'votescast'];
    }
}
