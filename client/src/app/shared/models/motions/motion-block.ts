import { BaseModel } from '../base.model';

/**
 * Representation of a motion block.
 * @ignore
 */
export class MotionBlock extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public title: string;
    public agenda_item_id: number;

    public constructor(id?: number, title?: string, agenda_item_id?: number) {
        super();
        this._collectionString = 'motions/motion-block';
        this.id = id;
        this.title = title;
        this.agenda_item_id = agenda_item_id;
    }

    public getAgenda(): BaseModel | BaseModel[] {
        return this.DS.get('agenda/item', this.agenda_item_id);
    }
}

BaseModel.registerCollectionElement('motions/motion-block', MotionBlock);
