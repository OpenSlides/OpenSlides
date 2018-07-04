import { BaseModel } from 'app/core/models/baseModel';

export class Countdown extends BaseModel {
    static collectionString = 'core/countdown';
    id: number;
    countdown_time: number;
    default_time: number;
    description: string;

    constructor(id: number, countdown_time?: number, default_time?: number, description?: string) {
        super(id);
        this.id = id;
        this.countdown_time = countdown_time;
        this.default_time = default_time;
        this.description = description;
    }

    public getCollectionString(): string {
        return Countdown.collectionString;
    }
}
