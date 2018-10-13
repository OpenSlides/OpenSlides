import { Deserializer } from '../base/deserializer';

/**
 * Representation of a speaker in an agenda item
 *
 * Part of the 'speakers' list.
 * @ignore
 */
export class Speaker extends Deserializer {
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
        super(input);
    }
}
