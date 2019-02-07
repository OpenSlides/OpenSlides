import { Workflow } from 'app/shared/models/motions/workflow';
import { WorkflowState } from 'app/shared/models/motions/workflow-state';
import { BaseViewModel } from '../../base/base-view-model';
import { Deserializable } from 'app/shared/models/base/deserializable';

/**
 * class for the ViewWorkflow. Currently only a basic stub
 *
 * Stores a Category including all (implicit) references
 * Provides "safe" access to variables and functions in {@link Category}
 * @ignore
 */
export class ViewWorkflow extends BaseViewModel {
    private _workflow: Workflow;

    public constructor(workflow?: Workflow) {
        super();
        this._workflow = workflow;
    }

    public get workflow(): Workflow {
        return this._workflow;
    }

    public get id(): number {
        return this.workflow ? this.workflow.id : null;
    }

    public get name(): string {
        return this.workflow ? this.workflow.name : null;
    }

    public get states(): WorkflowState[] {
        return this.workflow ? this.workflow.states : null;
    }

    public get first_state_id(): number {
        return this.workflow ? this.workflow.first_state_id : null;
    }

    public get firstState(): WorkflowState {
        return this.workflow ? this.workflow.firstState : null;
    }

    public getStateById(id: number): WorkflowState {
        return this.workflow ? this.workflow.getStateById(id) : null;
    }

    public getTitle(): string {
        return this.name;
    }

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
    public updateValues(update: Deserializable): void {
        if (update instanceof Workflow) {
            this._workflow = update;
        }
    }
}
