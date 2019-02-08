import { DetailNavigable } from '../../shared/models/base/detail-navigable';
import { ViewItem } from '../agenda/models/view-item';

/**
 * An Interface for all extra information needed for content objects of items.
 */
export interface AgendaInformation extends DetailNavigable {
    /**
     * Should return the title for the agenda list view.
     */
    getAgendaTitle: () => string;

    /**
     * Should return the title for the list of speakers view.
     */
    getAgendaTitleWithType: () => string;

    /**
     * An (optional) descriptive text to be exported in the CSV.
     */
    getCSVExportText(): string;

    /**
     * Get access to the agenda item
     */
    getAgendaItem(): ViewItem;
}
