import { AssignmentOption } from 'app/shared/models/assignments/assignment-option';
import { BaseViewModel } from '../../base/base-view-model';

export class ViewAssignmentOption extends BaseViewModel<AssignmentOption> {
    public get option(): AssignmentOption {
        return this._model;
    }
    public static COLLECTIONSTRING = AssignmentOption.COLLECTIONSTRING;
    protected _collectionString = AssignmentOption.COLLECTIONSTRING;
}

export interface ViewAssignmentOption extends AssignmentOption {}
