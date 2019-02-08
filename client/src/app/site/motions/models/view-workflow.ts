import { Workflow } from 'app/shared/models/motions/workflow';
import { WorkflowState } from 'app/shared/models/motions/workflow-state';
import { BaseViewModel } from '../../base/base-view-model';

/**
 * class for the ViewWorkflow.
 * @ignore
 */
export class ViewWorkflow extends BaseViewModel {
    private _workflow: Workflow;

    public get workflow(): Workflow {
        return this._workflow;
    }

    public get id(): number {
        return this.workflow.id;
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

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(workflow: Workflow) {
        super(Workflow.COLLECTIONSTRING);
        this._workflow = workflow;
    }

    public getTitle = () => {
        return this.name;
    };

    /**
     * Duplicate this motion into a copy of itself
     */
    public copy(): ViewWorkflow {
        return new ViewWorkflow(this._workflow);
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
