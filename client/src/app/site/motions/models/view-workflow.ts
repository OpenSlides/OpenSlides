import { Workflow } from 'app/shared/models/motions/workflow';
import { WorkflowState } from 'app/shared/models/motions/workflow-state';
import { BaseViewModel } from '../../base/base-view-model';

export const StateCssClassMapping = {
    success: 'green',
    danger: 'red',
    default: 'grey',
    primary: 'lightblue',
    warning: 'yellow'
};

export interface WorkflowTitleInformation {
    name: string;
}

/**
 * class for the ViewWorkflow.
 * @ignore
 */
export class ViewWorkflow extends BaseViewModel<Workflow> implements WorkflowTitleInformation {
    public static COLLECTIONSTRING = Workflow.COLLECTIONSTRING;

    public get workflow(): Workflow {
        return this._model;
    }

    public get name(): string {
        return this.workflow.name;
    }

    public get states(): WorkflowState[] {
        return this.workflow.states;
    }

    public get first_state_id(): number {
        return this.workflow.first_state_id;
    }

    public get firstState(): WorkflowState {
        return this.getStateById(this.first_state_id);
    }

    public constructor(workflow: Workflow) {
        super(Workflow.COLLECTIONSTRING, workflow);
    }

    public sortStates(): void {
        this.workflow.sortStates();
    }

    /**
     * Updates the local objects if required
     *
     * @param update
     */
    public updateDependencies(update: BaseViewModel): void {}

    public getStateById(id: number): WorkflowState {
        return this.states.find(state => id === state.id);
    }
}
