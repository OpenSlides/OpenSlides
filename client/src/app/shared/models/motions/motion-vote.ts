import { BaseVote } from '../poll/base-vote';

export class MotionVote extends BaseVote<MotionVote> {
    public static COLLECTIONSTRING = 'motions/motion-vote';

    public id: number;

    public constructor(input?: any) {
        super(MotionVote.COLLECTIONSTRING, input);
    }
}
