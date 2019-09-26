import { PollVoteValue } from 'app/core/ui-services/poll.service';
import { AssignmentOptionVote, AssignmentPollOption } from 'app/shared/models/assignments/assignment-poll-option';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ViewUser } from 'app/site/users/models/view-user';

/**
 * Defines the order the option's votes are sorted in (server might send raw data in any order)
 */
const votesOrder: PollVoteValue[] = ['Votes', 'Yes', 'No', 'Abstain'];

export class ViewAssignmentPollOption extends BaseViewModel<AssignmentPollOption> {
    public static COLLECTIONSTRING = AssignmentPollOption.COLLECTIONSTRING;
    protected _collectionString = AssignmentPollOption.COLLECTIONSTRING;

    public get option(): AssignmentPollOption {
        return this._model;
    }

    public get votes(): AssignmentOptionVote[] {
        return this.option.votes.sort((a, b) => votesOrder.indexOf(a.value) - votesOrder.indexOf(b.value));
    }
}
export interface ViewAssignmentPollOption extends AssignmentPollOption {
    user: ViewUser;
}
