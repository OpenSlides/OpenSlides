import { BaseModel } from '../base/base-model';

/**
 * Representation of a motion block.
 * @ignore
 */
export class MotionBlock extends BaseModel {
    public static COLLECTIONSTRING = 'motions/motion-block';

    public id: number;
    public title: string;
    public agenda_item_id: number;

    public constructor(input?: any) {
        super(MotionBlock.COLLECTIONSTRING, input);
    }
}
