import { BaseModel } from '../base.model';

/**
 * Representation of a countdown
 * @ignore
 */
export class Countdown extends BaseModel {
    public id: number;
    public description: string;
    public default_time: number;
    public countdown_time: number;
    public running: boolean;

    public constructor(input?: any) {
        super('core/countdown');
    }

    public toString(): string {
        return this.description;
    }
}

BaseModel.registerCollectionElement('core/countdown', Countdown);
