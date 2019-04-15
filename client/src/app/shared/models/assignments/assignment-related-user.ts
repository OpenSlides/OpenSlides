/**
 * Content of the 'assignment_related_users' property.
 */
export interface AssignmentRelatedUser {
    id: number;

    /**
     * id of the user this assignment user relates to
     */
    user_id: number;

    /**
     * The current 'elected' state
     */
    elected: boolean;

    /**
     * id of the related assignment
     */
    assignment_id: number;

    /**
     * A weight to determine the position in the list of candidates
     * (determined by the server)
     */
    weight: number;
}
