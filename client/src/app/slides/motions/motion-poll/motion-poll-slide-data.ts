import { MotionPollMethod } from 'app/shared/models/motions/motion-poll';
import { MajorityMethod, PercentBase, PollState, PollType } from 'app/shared/models/poll/base-poll';
import { MotionTitleInformation } from 'app/site/motions/models/view-motion';
import { BasePollSlideData } from 'app/slides/polls/base-poll-slide-data';

export interface MotionPollSlideData extends BasePollSlideData {
    motion: MotionTitleInformation;
    poll: {
        title: string;
        type: PollType;
        pollmethod: MotionPollMethod;
        state: PollState;
        onehundred_percent_base: PercentBase;
        voting_principle: number;
        majority_method: MajorityMethod;

        options: {
            yes?: number;
            no?: number;
            abstain?: number;
        }[];

        // optional for published polls:
        votesvalid: number;
        votesinvalid: number;
        votescast: number;
    };
}
