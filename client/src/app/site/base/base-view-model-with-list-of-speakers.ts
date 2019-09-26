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
        model.getModel !== undefined &&
        model.getModel().list_of_speakers_id !== undefined
    );
}

export interface BaseViewModelWithListOfSpeakers<M extends BaseModelWithListOfSpeakers = any> extends DetailNavigable {
    listOfSpeakers: any | null;
    getListOfSpeakersTitle: () => string;
    getListOfSpeakersSlideTitle: () => string;
}

export abstract class BaseViewModelWithListOfSpeakers<
    M extends BaseModelWithListOfSpeakers = any
> extends BaseProjectableViewModel<M> {
    public abstract getDetailStateURL(): string;
}
