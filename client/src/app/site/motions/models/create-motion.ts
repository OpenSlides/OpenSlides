import { Motion } from 'app/shared/models/motions/motion';

/**
 * Representation of Motion during creation. The submitters_id is added to send this information
 * as an array of user ids to the server.
 */
export class CreateMotion extends Motion {
    public submitters_id: number[];
}
