import { MotionOption } from 'app/shared/models/motions/motion-option';
import { BaseViewModel } from '../../base/base-view-model';

export class ViewMotionOption extends BaseViewModel<MotionOption> {
    public get option(): MotionOption {
        return this._model;
    }
    public static COLLECTIONSTRING = MotionOption.COLLECTIONSTRING;
    protected _collectionString = MotionOption.COLLECTIONSTRING;
}

export interface ViewMotionPoll extends MotionOption {}
