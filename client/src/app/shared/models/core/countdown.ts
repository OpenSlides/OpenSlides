import { BaseModel } from '../base.model';

/**
 * Representation of a countdown
 * @ignore
 */
export class Countdown extends BaseModel {
    protected _collectionString: string;
    id: number;
    description: string;
    default_time: number;
    countdown_time: number;
    running: boolean;

    constructor(id?: number, countdown_time?: number, default_time?: number, description?: string, running?: boolean) {
        super();
        this._collectionString = 'core/countdown';
        this.id = id;
        this.description = description;
        this.default_time = default_time;
        this.countdown_time = countdown_time;
        this.running = running;
    }
}

BaseModel.registerCollectionElement('core/countdown', Countdown);
