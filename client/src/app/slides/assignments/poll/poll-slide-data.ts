import { PollVoteValue } from 'app/site/polls/services/poll.service';

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
    assignments_poll_100_percent_base: any /*AssignmentPercentBase*/;
    poll: {
        published: boolean;
        description?: string;
        has_votes?: boolean;
        pollmethod?: any /*AssignmentPollmethods*/;
        votesno?: string;
        votesabstain?: string;
        votesvalid?: string;
        votesinvalid?: string;
        votescast?: string;
        options?: PollSlideOption[];
    };
}
