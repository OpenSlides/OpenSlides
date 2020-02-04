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

    public sumYN(): number {
        let sum = 0;
        sum += this.yes > 0 ? this.yes : 0;
        sum += this.no > 0 ? this.no : 0;
        return sum;
    }

    public sumYNA(): number {
        let sum = this.sumYN();
        sum += this.abstain > 0 ? this.abstain : 0;
        return sum;
    }
}

interface TIMotionOptionRelations {
    votes: ViewMotionVote[];
    poll: ViewMotionPoll;
}

export interface ViewMotionOption extends MotionOption, TIMotionOptionRelations {}
