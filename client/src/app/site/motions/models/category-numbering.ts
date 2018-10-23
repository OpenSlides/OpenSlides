import { Motion } from '../../../shared/models/motions/motion';

/**
 * wrapper class for the HTTP Call
 */
export class CategoryNumbering {
    private motions: number[];

    public constructor() {}

    public setMotions(motionList: Motion[]): void {
        const motion_id_list: number[] = [];
        motionList.forEach(motion => {
            motion_id_list.push(motion.id);
        });
        this.motions = motion_id_list;
    }

    public getMotions(): number[] {
        return this.motions;
    }
}
