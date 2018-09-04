import { Deserializable } from '../deserializable.model';

/**
 * Representation of a speaker in an agenda item
 *
 * Part of the 'speakers' list.
 * @ignore
 */
export class Speaker implements Deserializable {
    public id: number;
    public user_id: number;
    public begin_time: string; // TODO this is a time object
    public end_time: string; // TODO this is a time object
    public weight: number;
    public marked: boolean;
    public item_id: number;

    /**
     * Needs to be completely optional because agenda has (yet) the optional parameter 'speaker'
     * @param input
     */
    public constructor(input?: any) {
        if (input) {
            this.deserialize(input);
        }
    }

    public deserialize(input: any): void {
        Object.assign(this, input);
    }
}
