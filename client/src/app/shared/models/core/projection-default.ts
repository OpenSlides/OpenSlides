import { BaseModel } from '../base/base-model';

/**
 * Representation of a projection default
 *
 * @ignore
 */
export class ProjectionDefault extends BaseModel<ProjectionDefault> {
    public static COLLECTIONSTRING = 'core/projection-default';

    public id: number;
    public name: string;
    public display_name: string;
    public projector_id: number;

    public constructor(input?: any) {
        super(ProjectionDefault.COLLECTIONSTRING, input);
    }
}
