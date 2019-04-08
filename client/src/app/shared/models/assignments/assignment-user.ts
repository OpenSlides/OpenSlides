import { Deserializer } from '../base/deserializer';

/**
 * Content of the 'assignment_related_users' property.
 * Note that this differs from a ViewUser (e.g. different id)
 * @ignore
 */
export class AssignmentUser extends Deserializer {
    public id: number;

    /**
     * id of the user this assignment user relates to
     */
    public user_id: number;

    /**
     * The current 'elected' state
     */
    public elected: boolean;

    /**
     * id of the related assignment
     */
    public assignment_id: number;

    /**
     * A weight to determine the position in the list of candidates
     * (determined by the server)
     */
    public weight: number;

    /**
     * Constructor. Needs to be completely optional because assignment has
     * (yet) the optional parameter 'assignment_related_users'
     *
     * @param input
     */
    public constructor(input?: any) {
        super(input);
    }
}
