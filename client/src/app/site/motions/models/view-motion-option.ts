import { MotionOption } from 'app/shared/models/motions/motion-option';
import { ViewBaseOption } from 'app/site/polls/models/view-base-option';

export class ViewMotionOption extends ViewBaseOption<MotionOption> {
    public static COLLECTIONSTRING = MotionOption.COLLECTIONSTRING;
    protected _collectionString = MotionOption.COLLECTIONSTRING;
}
export interface ViewMotionOption extends MotionOption {}
