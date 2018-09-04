import { Deserializable } from '../deserializable.model';

/**
 * Representation of a Motion Submitter.
 *
 * @ignore
 */
export class MotionSubmitter implements Deserializable {
    public id: number;
    public user_id: number;
    public motion_id: number;
    public weight: number;

    public constructor(input?: any) {
        if (input) {
            this.deserialize(input);
        }
    }

    public deserialize(input: any): void {
        Object.assign(this, input);
    }
}
