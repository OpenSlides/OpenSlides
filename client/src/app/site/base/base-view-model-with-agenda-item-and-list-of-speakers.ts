import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { BaseModelWithAgendaItemAndListOfSpeakers } from 'app/shared/models/base/base-model-with-agenda-item-and-list-of-speakers';
import { BaseProjectableViewModel } from './base-projectable-view-model';
import { IBaseViewModelWithAgendaItem, isBaseViewModelWithAgendaItem } from './base-view-model-with-agenda-item';
import {
    IBaseViewModelWithListOfSpeakers,
    isBaseViewModelWithListOfSpeakers
} from './base-view-model-with-list-of-speakers';
import { ViewItem } from '../agenda/models/view-item';
import { ViewListOfSpeakers } from '../agenda/models/view-list-of-speakers';

export function isBaseViewModelWithAgendaItemAndListOfSpeakers(
    obj: any
): obj is BaseViewModelWithAgendaItemAndListOfSpeakers {
    return !!obj && isBaseViewModelWithAgendaItem(obj) && isBaseViewModelWithListOfSpeakers(obj);
}

/**
 * Base view class for view models with an agenda item and a list of speakers associated.
 */
export abstract class BaseViewModelWithAgendaItemAndListOfSpeakers<
    M extends BaseModelWithAgendaItemAndListOfSpeakers = any
> extends BaseProjectableViewModel implements IBaseViewModelWithAgendaItem<M>, IBaseViewModelWithListOfSpeakers<M> {
    protected _item?: ViewItem;
    protected _list_of_speakers?: ViewListOfSpeakers;

    public get agendaItem(): ViewItem | null {
        return this._item;
    }

    public get agenda_item_id(): number {
        return this._model.agenda_item_id;
    }

    public get agenda_item_number(): string | null {
        return this.agendaItem && this.agendaItem.itemNumber ? this.agendaItem.itemNumber : null;
    }

    public get listOfSpeakers(): ViewListOfSpeakers | null {
        return this._list_of_speakers;
    }

    public get list_of_speakers_id(): number {
        return this._model.list_of_speakers_id;
    }

    public getAgendaSlideTitle: () => string;
    public getAgendaListTitle: () => string;
    public getListOfSpeakersTitle: () => string;
    public getListOfSpeakersSlideTitle: () => string;

    public constructor(collectionString: string, model: M) {
        super(collectionString, model);
    }

    /**
     * @returns the (optional) descriptive text to be exported in the CSV.
     * May be overridden by inheriting classes
     */
    public getCSVExportText(): string {
        return '';
    }

    public abstract getDetailStateURL(): string;

    /**
     * Should return a string representation of the object, so there can be searched for.
     */
    public abstract formatForSearch(): SearchRepresentation;
}
