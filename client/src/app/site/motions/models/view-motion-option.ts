import { MotionOption } from 'app/shared/models/motions/motion-option';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewMotionPoll } from './view-motion-poll';
import { ViewMotionVote } from './view-motion-vote';

export class ViewMotionOption extends BaseViewModel<MotionOption> {
    public get option(): MotionOption {
        return this._model;
    }
    public static COLLECTIONSTRING = MotionOption.COLLECTIONSTRING;
    protected _collectionString = MotionOption.COLLECTIONSTRING;
}

interface TIMotionOptionRelations {
    votes: ViewMotionVote[];
    poll: ViewMotionPoll;
}

export interface ViewMotionOption extends MotionOption, TIMotionOptionRelations {}
