
import { BaseModel } from '../base/base-model';

/**
 * Representation of a history object.
 *
 * @ignore
 */
export class History extends BaseModel {
    public id: number;
    public element_id: string;
    public now: string;
    public information: string;
    public user_id: number;

    /**
     * return a date our of the given timestamp
     *
     * @returns a Data object
     */
    public get date(): Date {
        return new Date(this.now);
    }

    /**
     * Converts the timestamp to unix time
     */
    public get unixtime(): number {
        return Date.parse(this.now) / 1000;
    }

    public constructor(input?: any) {
        super('core/history', input);
    }

    public getTitle(): string {
        return this.element_id;
    }
}
