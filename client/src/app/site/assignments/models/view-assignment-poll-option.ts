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

    private _user?: ViewUser; // This is the "candidate". We'll stay consistent wich user here...

    public get option(): AssignmentPollOption {
        return this._model;
    }

    /**
     * Note: "User" instead of "candidate" to be consistent.
     */
    public get user(): ViewUser | null {
        return this._user;
    }

    public get id(): number {
        return this.option.id;
    }

    /**
     * Note: "User" instead of "candidate" to be consistent.
     */
    public get user_id(): number {
        return this.option.candidate_id;
    }

    public get is_elected(): boolean {
        return this.option.is_elected;
    }

    public get votes(): AssignmentOptionVote[] {
        return this.option.votes.sort((a, b) => votesOrder.indexOf(a.value) - votesOrder.indexOf(b.value));
    }

    public get poll_id(): number {
        return this.option.poll_id;
    }

    public get weight(): number {
        return this.option.weight;
    }
}
