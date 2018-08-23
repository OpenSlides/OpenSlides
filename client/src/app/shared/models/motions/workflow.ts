import { BaseModel } from '../base.model';
import { WorkflowState } from './workflow-state';

/**
 * Representation of a motion workflow. Has the nested property 'states'
 * @ignore
 */
export class Workflow extends BaseModel {
    protected _collectionString: string;
    id: number;
    name: string;
    states: WorkflowState[];
    first_state: number;

    constructor(id?: number, name?: string, states?: WorkflowState[], first_state?: number) {
        super();
        this._collectionString = 'motions/workflow';
        this.id = id;
        this.name = name;
        this.states = states;
        this.first_state = first_state;
    }

    /**
     * Check if the containing @link{WorkflowState}s contain a given ID
     * @param id The State ID
     */
    isStateContained(obj: number | WorkflowState): boolean {
        let id: number;
        if (obj instanceof WorkflowState) {
            id = obj.id;
        } else {
            id = obj;
        }

        return this.states.some(state => {
            if (state.id === id) {
                return true;
            }
        });
    }

    state_by_id(id: number): WorkflowState {
        let targetState;
        this.states.forEach(state => {
            if (id === state.id) {
                targetState = state;
            }
        });
        return targetState as WorkflowState;
    }

    deserialize(input: any): this {
        Object.assign(this, input);
        if (input.states instanceof Array) {
            this.states = [];
            input.states.forEach(workflowStateData => {
                this.states.push(new WorkflowState().deserialize(workflowStateData));
            });
        }
        return this;
    }
}
