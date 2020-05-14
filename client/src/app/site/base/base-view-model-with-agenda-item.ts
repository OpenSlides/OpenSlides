import { ProjectorTitle } from 'app/core/core-services/projector.service';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { BaseModelWithAgendaItem } from 'app/shared/models/base/base-model-with-agenda-item';
import { DetailNavigable, isDetailNavigable } from 'app/shared/models/base/detail-navigable';
import { BaseProjectableViewModel } from './base-projectable-view-model';
import { TitleInformation } from './base-view-model';
import { isSearchable, Searchable } from './searchable';

export interface AgendaListTitle {
    title: string;
    subtitle?: string;
}

export function isBaseViewModelWithAgendaItem(obj: any): obj is BaseViewModelWithAgendaItem {
    const model = <BaseViewModelWithAgendaItem>obj;
    return (
        !!obj &&
        isDetailNavigable(model) &&
        isSearchable(model) &&
        model.getAgendaSlideTitle !== undefined &&
        model.getAgendaListTitle !== undefined &&
        model.getCSVExportText !== undefined &&
        model.item !== undefined &&
        model.getModel !== undefined &&
        model.getModel().agenda_item_id !== undefined
    );
}

export interface TitleInformationWithAgendaItem extends TitleInformation {
    agenda_item_number?: () => string;
}

/**
 * Describes a base class for view models.
 */
export interface BaseViewModelWithAgendaItem<M extends BaseModelWithAgendaItem = any>
    extends BaseProjectableViewModel<M>,
        DetailNavigable,
        Searchable {
    item: any | null;

    /**
     * @returns the agenda title
     */
    getAgendaSlideTitle: () => string;

    /**
     * @return the agenda title with the verbose name of the content object
     */
    getAgendaListTitle: () => AgendaListTitle;
}

/**
 * Base view model class for view models with an agenda item.
 *
 * TODO: Resolve circular dependencies with `ViewItem` to avoid `any`.
 */
export abstract class BaseViewModelWithAgendaItem<
    M extends BaseModelWithAgendaItem = any
> extends BaseProjectableViewModel<M> {
    public agenda_item_number(): string | null {
        return this.item && this.item.item_number ? this.item.item_number : null;
    }

    /**
     * @returns the projector title used for managing projector elements.
     * Appends the agneda item comment as the subtitle, if this model has an agenda item
     */
    public getProjectorTitle(): ProjectorTitle {
        const subtitle = this.item ? this.item.comment : null;
        return { title: this.getTitle(), subtitle };
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
