import { AssignmentOption } from 'app/shared/models/assignments/assignment-option';
import { ViewUser } from 'app/site/users/models/view-user';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewAssignmentPoll } from './view-assignment-poll';
import { ViewAssignmentVote } from './view-assignment-vote';

export class ViewAssignmentOption extends BaseViewModel<AssignmentOption> {
    public get option(): AssignmentOption {
        return this._model;
    }
    public static COLLECTIONSTRING = AssignmentOption.COLLECTIONSTRING;
    protected _collectionString = AssignmentOption.COLLECTIONSTRING;
}

interface TIAssignmentOptionRelations {
    votes: ViewAssignmentVote[];
    user: ViewUser;
    poll: ViewAssignmentPoll;
}

export interface ViewAssignmentOption extends AssignmentOption, TIAssignmentOptionRelations {}
