import { BaseModel } from '../base/base-model';

/**
 * Representation of a Motion Submitter.
 *
 * @ignore
 */
export class Submitter extends BaseModel {
    public static COLLECTIONSTRING = 'motions/submitter';

    public id: number;
    public user_id: number;
    public motion_id: number;
    public weight: number;

    public constructor(input?: any) {
        super(Submitter.COLLECTIONSTRING, input);
    }
}
