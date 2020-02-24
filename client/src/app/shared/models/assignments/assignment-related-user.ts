import { BaseModel } from '../base/base-model';

/**
 * Content of the 'assignment_related_users' property.
 */
export class AssignmentRelatedUser extends BaseModel<AssignmentRelatedUser> {
    public static COLLECTIONSTRING = 'assignments/assignment-related-user';

    public id: number;
    public user_id: number;
    public assignment_id: number;
    public weight: number;

    public constructor(input?: any) {
        super(AssignmentRelatedUser.COLLECTIONSTRING, input);
    }
}
