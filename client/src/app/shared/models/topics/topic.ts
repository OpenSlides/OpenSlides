import { AgendaBaseModel } from '../base/agenda-base-model';
import { SearchRepresentation } from 'app/core/ui-services/search.service';

/**
 * Representation of a topic.
 * @ignore
 */
export class Topic extends AgendaBaseModel {
    public id: number;
    public title: string;
    public text: string;
    public attachments_id: number[];
    public agenda_item_id: number;

    public constructor(input?: any) {
        super('topics/topic', 'Topic', input);
    }

    public getTitle(): string {
        return this.title;
    }

    public getAgendaTitleWithType(): string {
        // Do not append ' (Topic)' to the title.
        return this.getAgendaTitle();
    }

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        return [this.title, this.text];
    }

    public getDetailStateURL(): string {
        return `/agenda/topics/${this.id}`;
    }

    /**
     * Returns the text to be inserted in csv exports
     * @override
     */
    public getCSVExportText(): string {
        return this.text;
    }
}
