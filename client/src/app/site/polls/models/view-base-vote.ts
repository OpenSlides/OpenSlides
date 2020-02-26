import { BaseVote } from 'app/shared/models/poll/base-vote';
import { ViewUser } from 'app/site/users/models/view-user';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewBaseOption } from './view-base-option';

export class ViewBaseVote<M extends BaseVote<M> = any> extends BaseViewModel<M> {
    public get vote(): M {
        return this._model;
    }
}

export interface ViewBaseVote<M extends BaseVote<M> = any> extends BaseVote<M> {
    user?: ViewUser;
    option: ViewBaseOption;
}
