import { AssignmentPollMethod } from 'app/shared/models/assignments/assignment-poll';
import { EntitledUsersEntry, MajorityMethod, PercentBase, PollState, PollType } from 'app/shared/models/poll/base-poll';
import { AssignmentTitleInformation } from 'app/site/assignments/models/view-assignment';
import { BasePollSlideData } from 'app/slides/polls/base-poll-slide-data';

export interface AssignmentPollSlideData extends BasePollSlideData {
    assignment: AssignmentTitleInformation;
    poll: {
        title: string;
        type: PollType;
        pollmethod: AssignmentPollMethod;
        max_votes_amount: number;
        min_votes_amount: number;
        description: string;
        state: PollState;
        onehundred_percent_base: PercentBase;
        majority_method: MajorityMethod;

        options: {
            user: {
                short_name: string;
            };
            yes?: number;
            no?: number;
            abstain?: number;
        }[];

        entitled_users_at_stop: EntitledUsersEntry[];

        // optional for published polls:
        amount_global_yes?: number;
        amount_global_no?: number;
        amount_global_abstain?: number;
        votesvalid: number;
        votesinvalid: number;
        votescast: number;
    };
}
