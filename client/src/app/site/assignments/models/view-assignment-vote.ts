import { AssignmentVote } from 'app/shared/models/assignments/assignment-vote';
import { ViewUser } from 'app/site/users/models/view-user';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewAssignmentOption } from './view-assignment-option';

export class ViewAssignmentVote extends BaseViewModel<AssignmentVote> {
    public get vote(): AssignmentVote {
        return this._model;
    }
    public static COLLECTIONSTRING = AssignmentVote.COLLECTIONSTRING;
    protected _collectionString = AssignmentVote.COLLECTIONSTRING;
}

interface TIAssignmentVoteRelations {
    user: ViewUser;
    option: ViewAssignmentOption;
}

export interface ViewAssignmentVote extends AssignmentVote, TIAssignmentVoteRelations {}
