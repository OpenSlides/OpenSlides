import { applyMixins } from 'app/core/mixins';
import { BaseModelWithAgendaItemAndListOfSpeakers } from 'app/shared/models/base/base-model-with-agenda-item-and-list-of-speakers';
import { BaseProjectableViewModel } from './base-projectable-view-model';
import { BaseViewModelWithAgendaItem, isBaseViewModelWithAgendaItem } from './base-view-model-with-agenda-item';
import {
    BaseViewModelWithListOfSpeakers,
    isBaseViewModelWithListOfSpeakers
} from './base-view-model-with-list-of-speakers';

export function isBaseViewModelWithAgendaItemAndListOfSpeakers(
    obj: any
): obj is BaseViewModelWithAgendaItemAndListOfSpeakers {
    return !!obj && isBaseViewModelWithAgendaItem(obj) && isBaseViewModelWithListOfSpeakers(obj);
}

export abstract class BaseViewModelWithAgendaItemAndListOfSpeakers<
    M extends BaseModelWithAgendaItemAndListOfSpeakers = any
> extends BaseProjectableViewModel<M> {}

export interface BaseViewModelWithAgendaItemAndListOfSpeakers<M extends BaseModelWithAgendaItemAndListOfSpeakers = any>
    extends BaseViewModelWithAgendaItem<M>,
        BaseViewModelWithListOfSpeakers<M> {}

applyMixins(BaseViewModelWithAgendaItemAndListOfSpeakers, [
    BaseViewModelWithAgendaItem,
    BaseViewModelWithListOfSpeakers
]);
