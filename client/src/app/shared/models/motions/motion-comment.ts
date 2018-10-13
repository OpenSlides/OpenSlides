import { Deserializer } from '../base/deserializer';

/**
 * Representation of a Motion Comment.
 */
export class MotionComment extends Deserializer {
    public id: number;
    public comment: string;
    public section_id: number;
    public read_groups_id: number[];

    public constructor(input?: any) {
        super(input);
    }
}
