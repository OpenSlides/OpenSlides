import { BaseModel } from '../base.model';
import { Mediafile } from '../mediafiles/mediafile';
import { Item } from '../agenda/item';

/**
 * Representation of a topic.
 * @ignore
 */
export class Topic extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public title: string;
    public text: string;
    public attachments_id: number[];
    public agenda_item_id: number;

    public constructor(id?: number, title?: string, text?: string, attachments_id?: number[], agenda_item_id?: number) {
        super();
        this._collectionString = 'topics/topic';
        this.id = id;
        this.title = title;
        this.text = text;
        this.attachments_id = attachments_id;
        this.agenda_item_id = agenda_item_id;
    }

    public getAttachments(): Mediafile[] {
        return this.DS.getMany<Mediafile>('mediafiles/mediafile', this.attachments_id);
    }

    public getAgenda(): Item {
        return this.DS.get<Item>('agenda/item', this.agenda_item_id);
    }
}

BaseModel.registerCollectionElement('topics/topic', Topic);
