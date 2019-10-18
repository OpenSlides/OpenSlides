import { BasePoll, BasePollWithoutNestedModels } from '../poll/base-poll';
import { MotionOption } from './motion-option';

export enum MotionPollmethods {
    'YN' = 'YN',
    'YNA' = 'YNA'
}

export interface MotionPollWithoutNestedModels extends BasePollWithoutNestedModels {
    motion_id: number;
    pollmethod: MotionPollmethods;
}

/**
 * Class representing a poll for a motion.
 */
export class MotionPoll extends BasePoll<MotionPoll, MotionOption> {
    public static COLLECTIONSTRING = 'motions/motion-poll';

    public id: number;

    public constructor(input?: any) {
        super(MotionPoll.COLLECTIONSTRING, input);
    }
}
export interface MotionPoll extends MotionPollWithoutNestedModels {}
