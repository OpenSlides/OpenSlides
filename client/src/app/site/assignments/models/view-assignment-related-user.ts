import { AssignmentRelatedUser } from 'app/shared/models/assignments/assignment-related-user';
import { ViewUser } from 'app/site/users/models/view-user';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { Updateable } from 'app/site/base/updateable';
import { Identifiable } from 'app/shared/models/base/identifiable';

export class ViewAssignmentRelatedUser implements Updateable, Identifiable {
    private _assignmentRelatedUser: AssignmentRelatedUser;
    private _user?: ViewUser;

    public get assignmentRelatedUser(): AssignmentRelatedUser {
        return this._assignmentRelatedUser;
    }

    public get user(): ViewUser {
        return this._user;
    }

    public get id(): number {
        return this.assignmentRelatedUser.id;
    }

    public get user_id(): number {
        return this.assignmentRelatedUser.user_id;
    }

    public get assignment_id(): number {
        return this.assignmentRelatedUser.assignment_id;
    }

    public get elected(): boolean {
        return this.assignmentRelatedUser.elected;
    }

    public get weight(): number {
        return this.assignmentRelatedUser.weight;
    }

    public constructor(assignmentRelatedUser: AssignmentRelatedUser, user?: ViewUser) {
        this._assignmentRelatedUser = assignmentRelatedUser;
        this._user = user;
    }

    public updateDependencies(update: BaseViewModel): void {
        if (update instanceof ViewUser && update.id === this.user_id) {
            this._user = update;
        }
    }
}
