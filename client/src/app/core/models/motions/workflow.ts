import { BaseModel } from 'app/core/models/base-model';
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
