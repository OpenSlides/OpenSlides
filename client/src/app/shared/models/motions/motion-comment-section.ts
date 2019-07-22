import { BaseModel } from '../base/base-model';

/**
 * Representation of a comment section.
 * @ignore
 */
export class MotionCommentSection extends BaseModel<MotionCommentSection> {
    public static COLLECTIONSTRING = 'motions/motion-comment-section';

    public id: number;
    public name: string;
    public read_groups_id: number[];
    public write_groups_id: number[];
    public weight: number;

    public constructor(input?: any) {
        super(MotionCommentSection.COLLECTIONSTRING, input);
    }
}
