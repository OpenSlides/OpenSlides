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

    private _states?: ViewState[];
    private _first_state?: ViewState;

    public get workflow(): Workflow {
        return this._model;
    }

    public get name(): string {
        return this.workflow.name;
    }

    public get states(): ViewState[] {
        return this._states || [];
    }

    public get states_id(): number[] {
        return this.workflow.states_id;
    }

    public get first_state_id(): number {
        return this.workflow.first_state_id;
    }

    public get first_state(): ViewState | null {
        return this._first_state;
    }

    public constructor(workflow: Workflow) {
        super(Workflow.COLLECTIONSTRING, workflow);
    }
}
