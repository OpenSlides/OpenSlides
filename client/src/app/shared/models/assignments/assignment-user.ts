import { Deserializer } from '../base/deserializer';

/**
 * Content of the 'assignment_related_users' property
 * @ignore
 */
export class AssignmentUser extends Deserializer {
    public id: number;
    public user_id: number;
    public elected: boolean;
    public assignment_id: number;
    public weight: number;

    /**
     * Needs to be completely optional because assignment has (yet) the optional parameter 'assignment_related_users'
     * @param input
     */
    public constructor(input?: any) {
        super(input);
    }
}
