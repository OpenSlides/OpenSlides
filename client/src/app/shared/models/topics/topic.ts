import { AgendaBaseModel } from '../base/agenda-base-model';

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

    public getDetailStateURL(): string {
        return `/agenda/topics/${this.id}`;
    }
}
