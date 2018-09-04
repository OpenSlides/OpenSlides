import { BaseModel } from '../base.model';

/**
 * Representation of a countdown
 * @ignore
 */
export class Countdown extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public description: string;
    public default_time: number;
    public countdown_time: number;
    public running: boolean;

    public constructor(input?: any) {
        super();
        this._collectionString = 'core/countdown';
        if (input) {
            this.deserialize(input);
        }
    }
}

BaseModel.registerCollectionElement('core/countdown', Countdown);
