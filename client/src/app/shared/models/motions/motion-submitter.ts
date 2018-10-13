import { Deserializer } from '../base/deserializer';
import { User } from '../users/user';

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

    public constructor(input?: any, motion_id?: number, weight?: number) {
        super();
        this.id = input.id;
        if (input instanceof User) {
            const user_obj = input as User;
            this.user_id = user_obj.id;
            this.motion_id = motion_id;
            this.weight = weight;
        } else {
            this.deserialize(input);
        }
    }
}
