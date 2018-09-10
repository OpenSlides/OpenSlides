import { Deserializer } from '../deserializer.model';

/**
 * Representation of a Motion Submitter.
 *
 * @ignore
 */
export class MotionSubmitter extends Deserializer {
    public id: number;
    public user_id: number;
    public motion_id: number;
    public weight: number;

    public constructor(input?: any) {
        super(input);
    }
}
