import { MergeAmendment, State } from 'app/shared/models/motions/state';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewWorkflow } from './view-workflow';

export interface StateTitleInformation {
    name: string;
}

/**
 * class for the ViewState.
 * @ignore
 */
export class ViewState extends BaseViewModel<State> implements StateTitleInformation {
    public static COLLECTIONSTRING = State.COLLECTIONSTRING;

    private _next_states?: ViewState[];
    public _workflow?: ViewWorkflow;

    public get state(): State {
        return this._model;
    }

    public get workflow(): ViewWorkflow | null {
        return this._workflow;
    }

    public get next_states(): ViewState[] {
        return this._next_states || [];
    }

    public get name(): string {
        return this.state.name;
    }

    public get recommendation_label(): string {
        return this.state.recommendation_label;
    }

    public get css_class(): string {
        return this.state.css_class;
    }

    public get restriction(): string[] {
        return this.state.restriction;
    }

    public get allow_support(): boolean {
        return this.state.allow_support;
    }

    public get allow_create_poll(): boolean {
        return this.state.allow_create_poll;
    }

    public get allow_submitter_edit(): boolean {
        return this.state.allow_submitter_edit;
    }

    public get dont_set_identifier(): boolean {
        return this.state.dont_set_identifier;
    }

    public get show_state_extension_field(): boolean {
        return this.state.show_state_extension_field;
    }

    public get merge_amendment_into_final(): MergeAmendment {
        return this.state.merge_amendment_into_final;
    }

    public get show_recommendation_extension_field(): boolean {
        return this.state.show_recommendation_extension_field;
    }

    public get next_states_id(): number[] {
        return this.state.next_states_id;
    }

    public get workflow_id(): number {
        return this.state.workflow_id;
    }

    public get isFinalState(): boolean {
        return !this.next_states_id || this.next_states_id.length === 0;
    }

    public get previous_states(): ViewState[] {
        if (!this.workflow) {
            return [];
        }
        return this.workflow.states.filter(state => {
            return state.next_states_id.includes(this.id);
        });
    }

    public constructor(state: State) {
        super(State.COLLECTIONSTRING, state);
    }
}
