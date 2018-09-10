import { BaseModel } from '../base.model';
import { Item } from '../agenda/item';

/**
 * Representation of a motion block.
 * @ignore
 */
export class MotionBlock extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public title: string;
    public agenda_item_id: number;

    public constructor(input?: any) {
        super();
        this._collectionString = 'motions/motion-block';
        if (input) {
            this.deserialize(input);
        }
    }

    public getAgenda(): BaseModel | BaseModel[] {
        return this.DS.get<Item>('agenda/item', this.agenda_item_id);
    }
}

BaseModel.registerCollectionElement('motions/motion-block', MotionBlock);
