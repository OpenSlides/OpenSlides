import { BaseModel } from '../base/base-model';
import { WorkflowState } from './workflow-state';

/**
 * Representation of a motion workflow. Has the nested property 'states'
 * @ignore
 */
export class Workflow extends BaseModel<Workflow> {
    public static COLLECTIONSTRING = 'motions/workflow';

    public id: number;
    public name: string;
    public states: WorkflowState[];
    public first_state_id: number;

    public constructor(input?: any) {
        super(Workflow.COLLECTIONSTRING, input);
    }

    /**
     * Check if the containing @link{WorkflowState}s contain a given ID
     * @param id The State ID
     */
    public isStateContained(obj: number | WorkflowState): boolean {
        let id: number;
        if (obj instanceof WorkflowState) {
            id = obj.id;
        } else {
            id = obj;
        }

        return this.states.some(state => state.id === id);
    }

    public deserialize(input: any): void {
        Object.assign(this, input);

        if (input.states instanceof Array) {
            this.states = input.states.map(workflowStateData => new WorkflowState(workflowStateData));
        }
    }
}
