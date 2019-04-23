/**
 * Representation of a speaker in an agenda item.
 *
 * Needs to be a baseModel since it has an own view class.
 * Part of the 'speakers' list.
 * @ignore
 */
export interface Speaker {
    id: number;
    user_id: number;

    /**
     * ISO datetime string to indicate the begin time of the speech. Empty if
     * the speaker has not started
     */
    begin_time: string;

    /**
     * ISO datetime string to indicate the end time of the speech. Empty if the
     * speech has not ended
     */
    end_time: string;

    weight: number;
    marked: boolean;
    item_id: number;
}
