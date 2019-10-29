import { AssignmentOption } from 'app/shared/models/assignments/assignment-option';
import { ViewUser } from 'app/site/users/models/view-user';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewAssignmentVote } from './view-assignment-vote';

export class ViewAssignmentOption extends BaseViewModel<AssignmentOption> {
    public get option(): AssignmentOption {
        return this._model;
    }
    public static COLLECTIONSTRING = AssignmentOption.COLLECTIONSTRING;
    protected _collectionString = AssignmentOption.COLLECTIONSTRING;
}

interface TIMotionOptionRelations {
    votes: ViewAssignmentVote[];
    user: ViewUser;
}

export interface ViewAssignmentOption extends AssignmentOption, TIMotionOptionRelations {}
