import { BaseModel } from '../base/base-model';

/**
 * Representation of a speaker in an agenda item.
 *
 * Needs to be a baseModel since it has an own view class.
 * Part of the 'speakers' list.
 * @ignore
 */
export class Speaker extends BaseModel<Speaker> {
    public static COLLECTIONSTRING = 'agenda/speaker';

    public id: number;
    public user_id: number;
    public weight: number;
    public marked: boolean;
    public item_id: number;
    public point_of_order: boolean;

    /**
     * ISO datetime string to indicate the begin time of the speech. Empty if
     * the speaker has not started
     */
    public begin_time: string;

    /**
     * ISO datetime string to indicate the end time of the speech. Empty if the
     * speech has not ended
     */
    public end_time: string;

    public constructor(input?: any) {
        super(Speaker.COLLECTIONSTRING, input);
    }
}
