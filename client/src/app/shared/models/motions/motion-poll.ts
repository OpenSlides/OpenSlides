import { BasePoll, BasePollWithoutNestedModels } from '../poll/base-poll';
import { MotionOption } from './motion-option';

export enum MotionPollMethods {
    YN = 'YN',
    YNA = 'YNA'
}
export const MotionPollMethodsVerbose = {
    YN: 'Yes/No',
    YNA: 'Yes/No/Abstain'
};

export interface MotionPollWithoutNestedModels extends BasePollWithoutNestedModels {
    motion_id: number;
    pollmethod: MotionPollMethods;

    readonly pollmethodVerbose: string;
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

    public get pollmethodVerbose(): string {
        return MotionPollMethodsVerbose[this.pollmethod];
    }
}
export interface MotionPoll extends MotionPollWithoutNestedModels {}
