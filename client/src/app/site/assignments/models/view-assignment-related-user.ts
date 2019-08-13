import { AssignmentRelatedUser } from 'app/shared/models/assignments/assignment-related-user';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ViewUser } from 'app/site/users/models/view-user';

export class ViewAssignmentRelatedUser extends BaseViewModel<AssignmentRelatedUser> {
    public static COLLECTIONSTRING = AssignmentRelatedUser.COLLECTIONSTRING;
    protected _collectionString = AssignmentRelatedUser.COLLECTIONSTRING;

    private _user?: ViewUser;

    public get assignmentRelatedUser(): AssignmentRelatedUser {
        return this._model;
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

    public getListTitle: () => string = this.getTitle;

    public getTitle: () => string = () => {
        return this.user ? this.user.getFullName() : '';
    };
}
