import { BaseProjectableViewModel } from './base-projectable-view-model';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { ViewItem } from '../agenda/models/view-item';
import { isDetailNavigable, DetailNavigable } from 'app/shared/models/base/detail-navigable';
import { isSearchable, Searchable } from './searchable';
import { BaseModelWithAgendaItem } from 'app/shared/models/base/base-model-with-agenda-item';
import { BaseViewModel, TitleInformation } from './base-view-model';
import { Item } from 'app/shared/models/agenda/item';

export function isBaseViewModelWithAgendaItem(obj: any): obj is BaseViewModelWithAgendaItem {
    const model = <BaseViewModelWithAgendaItem>obj;
    return (
        !!obj &&
        isDetailNavigable(model) &&
        isSearchable(model) &&
        model.getAgendaSlideTitle !== undefined &&
        model.getAgendaListTitle !== undefined &&
        model.getCSVExportText !== undefined &&
        model.agendaItem !== undefined &&
        model.agenda_item_id !== undefined
    );
}

export interface TitleInformationWithAgendaItem extends TitleInformation {
    agenda_item_number?: string;
}

/**
 * Describes a base class for view models.
 */
export interface IBaseViewModelWithAgendaItem<M extends BaseModelWithAgendaItem = any>
    extends BaseProjectableViewModel<M>,
        DetailNavigable,
        Searchable {
    agendaItem: ViewItem | null;

    agenda_item_id: number;

    agenda_item_number: string | null;

    /**
     * @returns the agenda title
     */
    getAgendaSlideTitle: () => string;

    /**
     * @return the agenda title with the verbose name of the content object
     */
    getAgendaListTitle: () => string;

    /**
     * @returns the (optional) descriptive text to be exported in the CSV.
     * May be overridden by inheriting classes
     */
    getCSVExportText(): string;
}

/**
 * Base view model class for view models with an agenda item.
 */
export abstract class BaseViewModelWithAgendaItem<M extends BaseModelWithAgendaItem = any>
    extends BaseProjectableViewModel<M>
    implements IBaseViewModelWithAgendaItem<M> {
    protected _item?: ViewItem;

    public get agendaItem(): ViewItem | null {
        return this._item;
    }

    public get agenda_item_id(): number {
        return this._model.agenda_item_id;
    }

    public get agenda_item_number(): string | null {
        return this.agendaItem && this.agendaItem.itemNumber ? this.agendaItem.itemNumber : null;
    }

    /**
     * @returns the agenda title for the item slides
     */
    public getAgendaSlideTitle: () => string;

    /**
     * @return the agenda title for the list view
     */
    public getAgendaListTitle: () => string;

    public constructor(collecitonString: string, model: M, item?: ViewItem) {
        super(collecitonString, model);
        this._item = item || null; // Explicit set to null instead of undefined, if not given
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

    public updateDependencies(update: BaseViewModel): void {
        // We cannot check with instanceof, because this gives circular dependency issues...
        if (update.collectionString === Item.COLLECTIONSTRING && update.id === this.agenda_item_id) {
            this._item = update as ViewItem;
        }
    }
}
