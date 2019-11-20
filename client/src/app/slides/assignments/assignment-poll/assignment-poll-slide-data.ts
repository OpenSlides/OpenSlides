import { AssignmentPollmethods } from 'app/shared/models/assignments/assignment-poll';
import { MajorityMethod, PercentBase, PollState, PollType } from 'app/shared/models/poll/base-poll';
import { AssignmentTitleInformation } from 'app/site/assignments/models/view-assignment';

export interface AssignmentPollSlideData {
    assignment: AssignmentTitleInformation;
    poll: {
        title: string;
        type: PollType;
        pollmethod: AssignmentPollmethods;
        votes_amount: number;
        description: string;
        state: PollState;
        onehundered_percent_base: PercentBase;
        majority_method: MajorityMethod;

        options: {
            user: string;
            yes?: string;
            no?: string;
            abstain?: string;
        }[];

        // optional for published polls:
        amount_global_no?: string;
        amount_global_abstain: string;
        votesvalid: string;
        votesinvalid: string;
        votescast: string;
    };
}
