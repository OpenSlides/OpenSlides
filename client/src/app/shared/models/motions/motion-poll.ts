import { CalculablePollKey } from 'app/site/polls/services/poll.service';
import { BasePoll, PercentBase } from '../poll/base-poll';
import { MotionOption } from './motion-option';

export enum MotionPollMethod {
    YN = 'YN',
    YNA = 'YNA'
}

/**
 * Class representing a poll for a motion.
 */
export class MotionPoll extends BasePoll<MotionPoll, MotionOption, MotionPollMethod, PercentBase> {
    public static COLLECTIONSTRING = 'motions/motion-poll';
    public static defaultGroupsConfig = 'motion_poll_default_groups';

    public id: number;
    public motion_id: number;

    public get pollmethodFields(): CalculablePollKey[] {
        const ynField: CalculablePollKey[] = ['yes', 'no'];
        if (this.pollmethod === MotionPollMethod.YN) {
            return ynField;
        } else if (this.pollmethod === MotionPollMethod.YNA) {
            return ynField.concat(['abstain']);
        }
    }

    public constructor(input?: any) {
        super(MotionPoll.COLLECTIONSTRING, input);
    }
}
