import { PollVoteValue } from 'app/core/ui-services/poll.service';
import { AssignmentPercentBase, AssignmentPollMethod } from 'app/site/assignments/services/assignment-poll.service';

export interface PollSlideOption {
    user: string;
    is_elected: boolean;
    votes: {
        weight: string;
        value: PollVoteValue;
    }[];
}

export interface PollSlideData {
    title: string;
    assignments_poll_100_percent_base: AssignmentPercentBase;
    poll: {
        published: boolean;
        description?: string;
        has_votes?: boolean;
        pollmethod?: AssignmentPollMethod;
        votesno?: string;
        votesabstain?: string;
        votesvalid?: string;
        votesinvalid?: string;
        votescast?: string;
        options?: PollSlideOption[];
    };
}
