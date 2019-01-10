import { AgendaInformation } from './agenda-information';
import { ProjectableBaseModel } from './projectable-base-model';
import { Searchable } from './searchable';
import { SearchRepresentation } from '../../../core/services/search.service';

/**
 * A base model for models, that can be content objects in the agenda. Provides title and navigation
 * information for the agenda.
 */
export abstract class AgendaBaseModel extends ProjectableBaseModel implements AgendaInformation, Searchable {
    /**
     * A model that can be a content object of an agenda item.
     * @param collectionString
     * @param verboseName
     * @param input
     */
    protected constructor(collectionString: string, verboseName: string, input?: any) {
        super(collectionString, verboseName, input);
    }

    /**
     * @returns the agenda title
     */
    public getAgendaTitle(): string {
        return this.getTitle();
    }

    /**
     * @return the agenda title with the verbose name of the content object
     */
    public getAgendaTitleWithType(): string {
        // Return the agenda title with the model's verbose name appended
        return this.getAgendaTitle() + ' (' + this.getVerboseName() + ')';
    }

    /**
     * @returns the (optional) descriptive text to be exported in the CSV.
     * May be overridden by inheriting classes
     */
    public getCSVExportText(): string {
        return '';
    }

    /**
     * Should return a string representation of the object, so there can be searched for.
     */
    public abstract formatForSearch(): SearchRepresentation;

    /**
     * Should return the URL to the detail view. Used for the agenda, that the
     * user can navigate to the content object.
     */
    public abstract getDetailStateURL(): string;
}
