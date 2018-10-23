import { BaseModel } from '../base/base-model';

/**
 * Representation of a motion change recommendation.
 * @ignore
 */
export class MotionChangeReco extends BaseModel<MotionChangeReco> {
    public id: number;
    public motion_id: number;
    public rejected: boolean;
    public type: number;
    public other_description: string;
    public line_from: number;
    public line_to: number;
    public text: string;
    public creation_time: string;

    public constructor(input?: any) {
        super('motions/motion-change-recommendation', input);
    }

    public getTitle(): string {
        return 'Changerecommendation';
    }
}
