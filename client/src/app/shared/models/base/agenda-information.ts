import { DetailNavigable } from "./detail-navigable";

/**
 * An Interface for all extra information needed for content objects of items.
 */
export interface AgendaInformation extends DetailNavigable {
    /**
     * Should return the title for the agenda list view.
     */
    getAgendaTitle(): string;

    /**
     * Should return the title for the list of speakers view.
     */
    getAgendaTitleWithType(): string;
}
