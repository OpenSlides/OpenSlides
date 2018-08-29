import { Deserializable } from '../deserializable.model';
import { Workflow } from './workflow';

/**
 * Representation of a workflow state
 *
 * Part of the 'states'-array in motion/workflow
 * @ignore
 */
export class WorkflowState implements Deserializable {
    public id: number;
    public name: string;
    public action_word: string;
    public recommendation_label: string;
    public css_class: string;
    public required_permission_to_see: string;
    public allow_support: boolean;
    public allow_create_poll: boolean;
    public allow_submitter_edit: boolean;
    public versioning: boolean;
    public leave_old_version_active: boolean;
    public dont_set_identifier: boolean;
    public show_state_extension_field: boolean;
    public show_recommendation_extension_field: boolean;
    public next_states_id: number[];
    public workflow_id: number;

    /**
     * Needs to be completely optional because Workflow has (yet) the optional parameter 'states'
     * @param id
     * @param name
     * @param action_word
     * @param recommendation_label
     * @param css_class
     * @param required_permission_to_see
     * @param allow_support
     * @param allow_create_poll
     * @param allow_submitter_edit
     * @param versioning
     * @param leave_old_version_active
     * @param dont_set_identifier
     * @param show_state_extension_field
     * @param show_recommendation_extension_field
     * @param next_states_id
     * @param workflow_id
     */
    public constructor(
        id?: number,
        name?: string,
        action_word?: string,
        recommendation_label?: string,
        css_class?: string,
        required_permission_to_see?: string,
        allow_support?: boolean,
        allow_create_poll?: boolean,
        allow_submitter_edit?: boolean,
        versioning?: boolean,
        leave_old_version_active?: boolean,
        dont_set_identifier?: boolean,
        show_state_extension_field?: boolean,
        show_recommendation_extension_field?: boolean,
        next_states_id?: number[],
        workflow_id?: number
    ) {
        this.id = id;
        this.name = name;
        this.action_word = action_word;
        this.recommendation_label = recommendation_label;
        this.css_class = css_class;
        this.required_permission_to_see = required_permission_to_see;
        this.allow_support = allow_support;
        this.allow_create_poll = allow_create_poll;
        this.allow_submitter_edit = allow_submitter_edit;
        this.versioning = versioning;
        this.leave_old_version_active = leave_old_version_active;
        this.dont_set_identifier = dont_set_identifier;
        this.show_state_extension_field = show_state_extension_field;
        this.show_recommendation_extension_field = show_recommendation_extension_field;
        this.next_states_id = next_states_id;
        this.workflow_id = workflow_id;
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

    public deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }

    public toString = (): string => {
        return this.name;
    };
}
