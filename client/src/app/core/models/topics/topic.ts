import { BaseModel } from 'app/core/models/baseModel';

export class Topic extends BaseModel {
    static collectionString = 'topics/topic';
    id: number;
    agenda_item_id: number;
    attachments_id: number[];
    text: string;
    title: string;

    constructor(id: number, agenda_item_id?: number, attachments_id?: number[], text?: string, title?: string) {
        super(id);
        this.agenda_item_id = agenda_item_id;
        this.attachments_id = attachments_id;
        this.text = text;
        this.title = title;
    }

    public getCollectionString(): string {
        return Topic.collectionString;
    }
}
