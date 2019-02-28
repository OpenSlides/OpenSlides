import { Deserializer } from '../base/deserializer';

/**
 * Determine the state of the speaker
 */
export enum SpeakerState {
    WAITING,
    CURRENT,
    FINISHED
}

/**
 * Representation of a speaker in an agenda item.
 *
 * Needs to be a baseModel since it has an own view class.
 * Part of the 'speakers' list.
 * @ignore
 */
export class Speaker extends Deserializer {
    public static COLLECTIONSTRING = 'agenda/item/speakers';

    public id: number;
    public user_id: number;

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

    /**
     * @returns
     *  - waiting if there is no begin nor end time
     *  - current if there is a begin time and not end time
     *  - finished if there are both begin and end time
     */
    public get state(): SpeakerState {
        if (!this.begin_time && !this.end_time) {
            return SpeakerState.WAITING;
        } else if (this.begin_time && !this.end_time) {
            return SpeakerState.CURRENT;
        } else {
            return SpeakerState.FINISHED;
        }
    }
}
