/**
 * An Interface for all extra information needed for content objects of items.
 */
export interface AgendaInformation {
    /**
     * Should return the title for the agenda list view.
     */
    getAgendaTitle(): string;

    /**
     * Should return the title for the list of speakers view.
     */
    getAgendaTitleWithType(): string;

    /**
     * Get the url for the detail view, so in the agenda the user can navigate to it.
     */
    getDetailStateURL(): string;
}
