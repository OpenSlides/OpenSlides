import { Deserializable } from '../base/deserializable';

/**
 * Representation of a history object.
 *
 * @ignore
 */
export class History implements Deserializable {
    public element_id: string;
    public timestamp: number;
    public information: string[];
    public user_id: number;

    /**
     * return a date our of the given timestamp
     *
     * @returns a Data object
     */
    public get date(): Date {
        return new Date(this.timestamp * 1000);
    }

    public get collectionString(): string {
        return this.element_id.split(':')[0];
    }

    public get modelId(): number {
        return +this.element_id.split(':')[1];
    }

    public constructor(input: History) {
        if (input) {
            this.deserialize(input);
        }
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

    public deserialize(input: any): void {
        Object.assign(this, input);
    }
}
