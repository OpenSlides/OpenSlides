import { Workflow } from 'app/shared/models/motions/workflow';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewState } from './view-state';

export interface WorkflowTitleInformation {
    name: string;
}

/**
 * class for the ViewWorkflow.
 * @ignore
 */
export class ViewWorkflow extends BaseViewModel<Workflow> implements WorkflowTitleInformation {
    public static COLLECTIONSTRING = Workflow.COLLECTIONSTRING;
    protected _collectionString = Workflow.COLLECTIONSTRING;

    public get workflow(): Workflow {
        return this._model;
    }
}
interface IWorkflowRelations {
    states?: ViewState[];
    first_state?: ViewState;
}
export interface ViewWorkflow extends Workflow, IWorkflowRelations {}
