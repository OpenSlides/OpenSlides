import { BaseOption } from '../poll/base-option';

export class MotionOption extends BaseOption<MotionOption> {
    public static COLLECTIONSTRING = 'motions/motion-option';

    public constructor(input?: any) {
        super(MotionOption.COLLECTIONSTRING, input);
    }
}
