import { BaseOption } from 'app/shared/models/poll/base-option';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewBasePoll } from './view-base-poll';
import { ViewBaseVote } from './view-base-vote';

export class ViewBaseOption<M extends BaseOption<M> = any> extends BaseViewModel<M> {
    public get option(): M {
        return this._model;
    }
}

export interface ViewBaseOption<M extends BaseOption<M> = any> extends BaseOption<M> {
    votes: ViewBaseVote[];
    poll: ViewBasePoll;
}
