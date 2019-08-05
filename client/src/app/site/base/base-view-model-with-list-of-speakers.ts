import { BaseModelWithListOfSpeakers } from 'app/shared/models/base/base-model-with-list-of-speakers';
import { DetailNavigable, isDetailNavigable } from 'app/shared/models/base/detail-navigable';
import { BaseProjectableViewModel } from './base-projectable-view-model';

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
    protected _list_of_speakers?: any;

    public get listOfSpeakers(): any | null {
        return this._list_of_speakers;
    }

    public get list_of_speakers_id(): number {
        return this._model.list_of_speakers_id;
    }

    public getListOfSpeakersTitle: () => string;
    public getListOfSpeakersSlideTitle: () => string;

    public constructor(model: M, listOfSpeakers?: any) {
        super(model);
        this._list_of_speakers = listOfSpeakers || null; // Explicit set to null instead of undefined, if not given
    }

    public abstract getDetailStateURL(): string;
}
