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
     * @param id
     * @param user_id
     * @param begin_time
     * @param end_time
     * @param weight
     * @param marked
     * @param item_id
     */
    public constructor(
        id?: number,
        user_id?: number,
        begin_time?: string,
        end_time?: string,
        weight?: number,
        marked?: boolean,
        item_id?: number
    ) {
        this.id = id;
        this.user_id = user_id;
        this.begin_time = begin_time;
        this.end_time = end_time;
        this.weight = weight;
        this.marked = marked;
        this.item_id = item_id;
    }

    public deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}
