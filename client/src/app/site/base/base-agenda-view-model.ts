import { AgendaInformation } from 'app/site/base/agenda-information';
import { BaseProjectableViewModel } from './base-projectable-view-model';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { ViewItem } from '../agenda/models/view-item';

export function isAgendaBaseModel(obj: object): obj is BaseAgendaViewModel {
    const agendaViewModel = <BaseAgendaViewModel>obj;
    return (
        agendaViewModel.getAgendaTitle !== undefined &&
        agendaViewModel.getAgendaTitleWithType !== undefined &&
        agendaViewModel.getCSVExportText !== undefined &&
        agendaViewModel.getAgendaItem !== undefined &&
        agendaViewModel.getDetailStateURL !== undefined
    );
}

/**
 * Base view class for projectable models.
 */
export abstract class BaseAgendaViewModel extends BaseProjectableViewModel implements AgendaInformation {
    /**
     * @returns the contained agenda item
     */
    public abstract getAgendaItem(): ViewItem;

    /**
     * @returns the agenda title
     */
    public getAgendaTitle = () => {
        return this.getTitle();
    };

    /**
     * @return the agenda title with the verbose name of the content object
     */
    public getAgendaTitleWithType = () => {
        // Return the agenda title with the model's verbose name appended
        return this.getAgendaTitle() + ' (' + this.getVerboseName() + ')';
    };

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
