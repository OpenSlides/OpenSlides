import { AssignmentVote } from 'app/shared/models/assignments/assignment-vote';
import { ViewBaseVote } from 'app/site/polls/models/view-base-vote';

export class ViewAssignmentVote extends ViewBaseVote<AssignmentVote> {
    public static COLLECTIONSTRING = AssignmentVote.COLLECTIONSTRING;
    protected _collectionString = AssignmentVote.COLLECTIONSTRING;
}

export interface ViewAssignmentVote extends AssignmentVote {}
