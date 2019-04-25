import { AssignmentPercentBase, AssignmentPollMethod } from 'app/site/assignments/services/assignment-poll.service';
import { PollVoteValue } from 'app/core/ui-services/poll.service';

export interface PollSlideOption {
    user: string;
    is_elected: boolean;
    votes: {
        weight: PollVoteValue;
        value: string;
        percent?: string;
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
        votesno?: string; // TODO: same conversion needed as for the PollModel
        votesabstain?: string;
        votesvalid?: string;
        votesinvalid?: string;
        votescast?: string;
        options?: PollSlideOption[];
    };
}
