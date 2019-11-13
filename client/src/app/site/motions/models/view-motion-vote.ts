import { MotionVote } from 'app/shared/models/motions/motion-vote';
import { ViewUser } from 'app/site/users/models/view-user';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewMotionOption } from './view-motion-option';

export class ViewMotionVote extends BaseViewModel<MotionVote> {
    public get vote(): MotionVote {
        return this._model;
    }
    public static COLLECTIONSTRING = MotionVote.COLLECTIONSTRING;
    protected _collectionString = MotionVote.COLLECTIONSTRING;
}

interface TIMotionVoteRelations {
    user?: ViewUser;
    option: ViewMotionOption;
}

export interface ViewMotionVote extends MotionVote, TIMotionVoteRelations {}
