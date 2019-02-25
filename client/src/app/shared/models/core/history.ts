import { BaseModel } from '../base/base-model';

/**
 * Representation of a history object.
 *
 * @ignore
 */
export class History extends BaseModel {
    public static COLLECTIONSTRING = 'core/history';
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
        super(History.COLLECTIONSTRING, input);
    }

    /**
     * Converts the date (this.now) to a time and date string.
     *
     * @param locale locale indicator, i.e 'de-DE'
     * @returns a human readable kind of time and date representation
     */
    public getLocaleString(locale: string): string {
        return this.date.toLocaleString(locale);
    }
}
