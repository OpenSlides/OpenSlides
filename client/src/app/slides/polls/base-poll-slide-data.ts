import { MajorityMethod, PercentBase, PollState, PollType } from 'app/shared/models/poll/base-poll';

export interface BasePollSlideData {
    poll: {
        title: string;
        type: PollType;
        state: PollState;
        onehundred_percent_base: PercentBase;
        majority_method: MajorityMethod;
        pollmethod: string;

        options: {
            yes?: number;
            no?: number;
            abstain?: number;
        }[];

        votesvalid: number;
        votesinvalid: number;
        votescast: number;
    };
}
