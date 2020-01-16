import { BasePoll } from '../poll/base-poll';
import { MotionOption } from './motion-option';

export enum MotionPollMethods {
    YN = 'YN',
    YNA = 'YNA'
}

/**
 * Class representing a poll for a motion.
 */
export class MotionPoll extends BasePoll<MotionPoll, MotionOption> {
    public static COLLECTIONSTRING = 'motions/motion-poll';

    public id: number;
    public motion_id: number;
    public pollmethod: MotionPollMethods;

    public constructor(input?: any) {
        super(MotionPoll.COLLECTIONSTRING, input);
    }
}
