import { BaseModel } from '../base/base-model';

/**
 * Representation of a motion category. Has the nested property "File"
 * @ignore
 */
export class MotionCommentSection extends BaseModel<MotionCommentSection> {
    public id: number;
    public name: string;
    public read_groups_id: number[];
    public write_groups_id: number[];

    public constructor(input?: any) {
        super('motions/motion-comment-section', input);
    }

    public getTitle(): string {
        return this.name;
    }
}
