import { BaseProjectableViewModel } from './base-projectable-view-model';
import { isDetailNavigable, DetailNavigable } from 'app/shared/models/base/detail-navigable';
import { BaseModelWithListOfSpeakers } from 'app/shared/models/base/base-model-with-list-of-speakers';
import { BaseViewModel } from './base-view-model';
import { ListOfSpeakers } from 'app/shared/models/agenda/list-of-speakers';

export function isBaseViewModelWithListOfSpeakers(obj: any): obj is BaseViewModelWithListOfSpeakers {
    const model = <BaseViewModelWithListOfSpeakers>obj;
    return (
        !!obj &&
        isDetailNavigable(model) &&
        model.getListOfSpeakersTitle !== undefined &&
        model.listOfSpeakers !== undefined &&
        model.list_of_speakers_id !== undefined
    );
}

/**
 * Describes a base view model with a list of speakers.
 */
export interface IBaseViewModelWithListOfSpeakers<M extends BaseModelWithListOfSpeakers = any>
    extends BaseProjectableViewModel<M>,
        DetailNavigable {
    listOfSpeakers: any | null;

    list_of_speakers_id: number;

    getListOfSpeakersTitle: () => string;

    getListOfSpeakersSlideTitle: () => string;
}

/**
 * Base view model class for models with a list of speakers.
 *
 * TODO: Resolve circular dependencies with `ViewListOfSpeakers` to avoid `any`.
 */
export abstract class BaseViewModelWithListOfSpeakers<M extends BaseModelWithListOfSpeakers = any>
    extends BaseProjectableViewModel<M>
    implements IBaseViewModelWithListOfSpeakers<M> {
    protected _listOfSpeakers?: any;

    public get listOfSpeakers(): any | null {
        return this._listOfSpeakers;
    }

    public get list_of_speakers_id(): number {
        return this._model.list_of_speakers_id;
    }

    public getListOfSpeakersTitle: () => string;
    public getListOfSpeakersSlideTitle: () => string;

    public constructor(collectionString: string, model: M, listOfSpeakers?: any) {
        super(collectionString, model);
        this._listOfSpeakers = listOfSpeakers || null; // Explicit set to null instead of undefined, if not given
    }

    public abstract getDetailStateURL(): string;

    public updateDependencies(update: BaseViewModel): void {
        // We cannot check with instanceof, becuase this givec circular dependency issues...
        if (update.collectionString === ListOfSpeakers.COLLECTIONSTRING && update.id === this.list_of_speakers_id) {
            this._listOfSpeakers = update;
        }
    }
}
