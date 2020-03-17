import { MotionVote } from 'app/shared/models/motions/motion-vote';
import { ViewBaseVote } from 'app/site/polls/models/view-base-vote';

export class ViewMotionVote extends ViewBaseVote<MotionVote> {
    public static COLLECTIONSTRING = MotionVote.COLLECTIONSTRING;
    protected _collectionString = MotionVote.COLLECTIONSTRING;
}

export interface ViewMotionVote extends MotionVote {}
