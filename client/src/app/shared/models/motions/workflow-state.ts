import { Deserializable } from '../deserializable.model';

/**
 * Representation of a workflow state
 *
 * Part of the 'states'-array in motion/workflow
 * @ignore
 */
export class WorkflowState implements Deserializable {
    id: number;
    name: string;
    action_word: string;
    recommendation_label: string;
    css_class: string;
    required_permission_to_see: string;
    allow_support: boolean;
    allow_create_poll: boolean;
    allow_submitter_edit: boolean;
    versioning: boolean;
    leave_old_version_active: boolean;
    dont_set_identifier: boolean;
    show_state_extension_field: boolean;
    show_recommendation_extension_field: boolean;
    next_states_id: number[];
    workflow_id: number;

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
    constructor(
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

    deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}
