import { BaseModel } from 'app/core/models/baseModel';

export class MotionBlock extends BaseModel {
    static collectionString = 'motions/motion-block';
    id: number;
    agenda_item_id: number;
    title: string;

    constructor(id: number, agenda_item_id?: number, title?: string) {
        super(id);
        this.agenda_item_id = agenda_item_id;
        this.title = title;
    }

    public getCollectionString(): string {
        return MotionBlock.collectionString;
    }
}
