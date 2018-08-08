import { Deserializable } from '../deserializable.model';

/**
 * Representation of a Motion Submitter.
 *
 * @ignore
 */
export class MotionSubmitter implements Deserializable {
    id: number;
    user_id: number;
    motion_id: number;
    weight: number;

    constructor(id?: number, user_id?: number, motion_id?: number, weight?: number) {
        this.id = id;
        this.user_id = user_id;
        this.motion_id = motion_id;
        this.weight = weight;
    }

    deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}
