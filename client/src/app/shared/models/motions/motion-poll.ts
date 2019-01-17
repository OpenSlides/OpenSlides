import { Deserializer } from '../base/deserializer';

/**
 * Class representing a poll for a motion.
 */
export class MotionPoll extends Deserializer {
    public id: number;
    public yes: number;
    public no: number;
    public abstain: number;
    public votesvalid: number;
    public votesinvalid: number;
    public votescast: number;
    public has_votes: boolean;
    public motion_id: number;

    /**
     * Needs to be completely optional because motion has (yet) the optional parameter 'polls'
     * Tries to cast incoming strings as numbers
     * @param input
     */
    public constructor(input?: any) {
        if (typeof input === 'object') {
            Object.keys(input).forEach(key => {
                if (typeof input[key] === 'string') {
                    input[key] = parseInt(input[key], 10);
                }
            });
        }
        super(input);
    }

    public deserialize(input: any): void {
        Object.assign(this, input);
    }
}
