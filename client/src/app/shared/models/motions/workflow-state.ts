import { Deserializer } from '../base/deserializer';
import { Workflow } from './workflow';

/**
 * Specifies if an amendment of this state/recommendation should be merged into the motion
 */
export enum MergeAmendment {
    NO = -1,
    UNDEFINED = 0,
    YES = 1
}

/**
 * Representation of a workflow state
 *
 * Part of the 'states'-array in motion/workflow
 * @ignore
 */
export class WorkflowState extends Deserializer {
    public id: number;
    public name: string;
    public action_word: string;
    public recommendation_label: string;
    public css_class: string;
    public required_permission_to_see: string;
    public allow_support: boolean;
    public allow_create_poll: boolean;
    public allow_submitter_edit: boolean;
    public dont_set_identifier: boolean;
    public show_state_extension_field: number;
    public merge_amendment_into_final: MergeAmendment;
    public show_recommendation_extension_field: boolean;
    public next_states_id: number[];
    public workflow_id: number;

    /**
     * Needs to be completely optional because Workflow has (yet) the optional parameter 'states'
     * @param input If given, it will be deserialized
     */
    public constructor(input?: any) {
        super(input);
    }

    /**
     * return a list of the next possible states.
     * Also adds the current state.
     */
    public getNextStates(workflow: Workflow): WorkflowState[] {
        const nextStates = [];
        workflow.states.forEach(state => {
            if (this.next_states_id.includes(state.id)) {
                nextStates.push(state as WorkflowState);
            }
        });
        return nextStates;
    }

    public toString = (): string => {
        return this.name;
    };
}
