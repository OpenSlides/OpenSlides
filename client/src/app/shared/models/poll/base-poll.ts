import { BaseDecimalModel } from '../base/base-decimal-model';
import { BaseOption } from './base-option';

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

export interface BasePollWithoutNestedModels {
    state: PollState;
    type: PollType;
    title: string;
    votesvalid: number;
    votesinvalid: number;
    votescast: number;
    groups_id: number[];
    voted_id: number[];
}

export abstract class BasePoll<T, O extends BaseOption<any>> extends BaseDecimalModel<T> {
    public options: O[];

    protected decimalFields: (keyof BasePoll<T, O>)[] = ['votesvalid', 'votesinvalid', 'votescast'];
}
export interface BasePoll<T, O extends BaseOption<any>> extends BasePollWithoutNestedModels {}
