import { BaseModel } from '../base.model';

/**
 * Representation of a topic.
 * @ignore
 */
export class Topic extends BaseModel {
    public id: number;
    public title: string;
    public text: string;
    public attachments_id: number[];
    public agenda_item_id: number;

    public constructor(input?: any) {
        super('topics/topic', input);
    }

    public toString(): string {
        return this.title;
    }
}

BaseModel.registerCollectionElement('topics/topic', Topic);
