import { AgendaInformation } from './agenda-information';
import { ProjectableBaseModel } from './projectable-base-model';

/**
 * A base model for models, that can be content objects in the agenda. Provides title and navigation
 * information for the agenda.
 */
export abstract class AgendaBaseModel extends ProjectableBaseModel implements AgendaInformation {
    protected verboseName: string;

    /**
     * A Model that inherits from this class should provide a verbose name. It's used by creating
     * the agenda title with type.
     * @param collectionString
     * @param verboseName
     * @param input
     */
    protected constructor(collectionString: string, verboseName: string, input?: any) {
        super(collectionString, input);
        this.verboseName = verboseName;
    }

    public getAgendaTitle(): string {
        return this.getTitle();
    }

    public getAgendaTitleWithType(): string {
        // Return the agenda title with the model's verbose name appended
        return this.getAgendaTitle() + ' (' + this.verboseName + ')';
    }

    /**
     * Should return the URL to the detail view. Used for the agenda, that the
     * user can navigate to the content object.
     */
    public abstract getDetailStateURL(): string;
}
