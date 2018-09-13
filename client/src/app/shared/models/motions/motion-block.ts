import { BaseModel } from '../base.model';
import { Item } from '../agenda/item';

/**
 * Representation of a motion block.
 * @ignore
 */
export class MotionBlock extends BaseModel {
    public id: number;
    public title: string;
    public agenda_item_id: number;

    public constructor(input?: any) {
        super('motions/motion-block', input);
    }

    public getAgenda(): BaseModel | BaseModel[] {
        return this.DS.get<Item>('agenda/item', this.agenda_item_id);
    }

    public toString(): string {
        return this.title;
    }
}

BaseModel.registerCollectionElement('motions/motion-block', MotionBlock);
