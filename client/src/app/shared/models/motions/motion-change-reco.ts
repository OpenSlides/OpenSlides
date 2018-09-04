import { BaseModel } from '../base.model';

/**
 * Representation of a motion change recommendation.
 * @ignore
 */
export class MotionChangeReco extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public motion_version_id: number;
    public rejected: boolean;
    public type: number;
    public other_description: string;
    public line_from: number;
    public line_to: number;
    public text: string;
    public creation_time: string;

    public constructor(input?: any) {
        super();
        this._collectionString = 'motions/motion-change-recommendation';
        if (input) {
            this.deserialize(input);
        }
    }
}

BaseModel.registerCollectionElement('motions/motion-change-recommendation', MotionChangeReco);
