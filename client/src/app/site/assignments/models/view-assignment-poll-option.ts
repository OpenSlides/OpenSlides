import { ViewUser } from 'app/site/users/models/view-user';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { Updateable } from 'app/site/base/updateable';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { PollVoteValue } from 'app/core/ui-services/poll.service';
import { AssignmentPollOption } from 'app/shared/models/assignments/assignment-poll-option';

export class ViewAssignmentPollOption implements Identifiable, Updateable {
    private _assignmentPollOption: AssignmentPollOption;
    private _user: ViewUser; // This is the "candidate". We'll stay consistent wich user here...

    public get option(): AssignmentPollOption {
        return this._assignmentPollOption;
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

    public get votes(): {
        weight: number;
        value: PollVoteValue;
    }[] {
        return this.option.votes;
    }

    public get poll_id(): number {
        return this.option.poll_id;
    }

    public get weight(): number {
        return this.option.weight;
    }

    public constructor(assignmentPollOption: AssignmentPollOption, user?: ViewUser) {
        this._assignmentPollOption = assignmentPollOption;
        this._user = user;
    }

    public updateDependencies(update: BaseViewModel): void {
        if (update instanceof ViewUser && update.id === this.user_id) {
            this._user = update;
        }
    }
}
