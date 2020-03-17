import { AssignmentOption } from 'app/shared/models/assignments/assignment-option';
import { ViewBaseOption } from 'app/site/polls/models/view-base-option';
import { ViewUser } from 'app/site/users/models/view-user';

export class ViewAssignmentOption extends ViewBaseOption<AssignmentOption> {
    public static COLLECTIONSTRING = AssignmentOption.COLLECTIONSTRING;
    protected _collectionString = AssignmentOption.COLLECTIONSTRING;
}

export interface ViewAssignmentOption extends AssignmentOption {
    user: ViewUser;
}
