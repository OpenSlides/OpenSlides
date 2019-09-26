import { State } from 'app/shared/models/motions/state';
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
    protected _collectionString = State.COLLECTIONSTRING;

    public get state(): State {
        return this._model;
    }

    public get isFinalState(): boolean {
        return (
            !this.next_states_id ||
            !this.next_states_id.length ||
            (this.next_states_id.length === 1 && this.next_states_id[0] === 0)
        );
    }
}

interface IStateRelations {
    next_states?: ViewState[];
    previous_states?: ViewState[];
    workflow?: ViewWorkflow;
}
export interface ViewState extends State, IStateRelations {}
