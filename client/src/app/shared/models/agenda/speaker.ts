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

    /**
     * Getting the title of a speaker does not make much sense.
     * Usually it would refer to the title of a user.
     */
    public getTitle(): string {
        return '';
    }
}
