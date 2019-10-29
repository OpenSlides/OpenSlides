import { AssignmentRelatedUser } from './assignment-related-user';
import { BaseModelWithAgendaItemAndListOfSpeakers } from '../base/base-model-with-agenda-item-and-list-of-speakers';

export interface AssignmentWithoutNestedModels extends BaseModelWithAgendaItemAndListOfSpeakers<Assignment> {
    id: number;
    title: string;
    description: string;
    open_posts: number;
    phase: number; // see Openslides constants
    poll_description_default: number;
    tags_id: number[];
    attachments_id: number[];
}

/**
 * Representation of an assignment.
 * @ignore
 */
export class Assignment extends BaseModelWithAgendaItemAndListOfSpeakers<Assignment> {
    public static COLLECTIONSTRING = 'assignments/assignment';

    public id: number;
    public assignment_related_users: AssignmentRelatedUser[];

    public constructor(input?: any) {
        super(Assignment.COLLECTIONSTRING, input);
    }
}
export interface Assignment extends AssignmentWithoutNestedModels {}
