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

    public constructor(input?: any) {
        super();
        this._collectionString = 'topics/topic';
        if (input) {
            this.deserialize(input);
        }
    }

    public getAttachments(): Mediafile[] {
        return this.DS.getMany<Mediafile>('mediafiles/mediafile', this.attachments_id);
    }

    public getAgenda(): Item {
        return this.DS.get<Item>('agenda/item', this.agenda_item_id);
    }
}

BaseModel.registerCollectionElement('topics/topic', Topic);
