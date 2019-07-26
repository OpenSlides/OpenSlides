import { AssignmentPoll } from './assignment-poll';
import { AssignmentRelatedUser } from './assignment-related-user';
import { BaseModelWithAgendaItemAndListOfSpeakers } from '../base/base-model-with-agenda-item-and-list-of-speakers';

/**
 * Representation of an assignment.
 * @ignore
 */
export class Assignment extends BaseModelWithAgendaItemAndListOfSpeakers<Assignment> {
    public static COLLECTIONSTRING = 'assignments/assignment';

    public id: number;
    public title: string;
    public description: string;
    public open_posts: number;
    public phase: number; // see Openslides constants
    public assignment_related_users: AssignmentRelatedUser[];
    public poll_description_default: number;
    public polls: AssignmentPoll[];
    public tags_id: number[];
    public attachments_id: number[];

    public constructor(input?: any) {
        super(Assignment.COLLECTIONSTRING, input);
    }

    public get candidates_id(): number[] {
        return this.assignment_related_users
            .sort((a: AssignmentRelatedUser, b: AssignmentRelatedUser) => {
                return a.weight - b.weight;
            })
            .map((candidate: AssignmentRelatedUser) => candidate.user_id);
    }

    public deserialize(input: any): void {
        Object.assign(this, input);

        this.polls = [];
        if (input.polls instanceof Array) {
            this.polls = input.polls.map(pollData => new AssignmentPoll(pollData));
        }
    }
}
