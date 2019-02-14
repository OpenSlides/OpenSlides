import { AssignmentUser } from './assignment-user';
import { Poll } from './poll';
import { BaseModel } from '../base/base-model';

export const assignmentPhase = [
    { key: 0, name: 'Searching for candidates' },
    { key: 1, name: 'Voting' },
    { key: 2, name: 'Finished' }
];

/**
 * Representation of an assignment.
 * @ignore
 */
export class Assignment extends BaseModel<Assignment> {
    public static COLLECTIONSTRING = 'assignments/assignment';
    public id: number;
    public title: string;
    public description: string;
    public open_posts: number;
    public phase: number;
    public assignment_related_users: AssignmentUser[];
    public poll_description_default: number;
    public polls: Poll[];
    public agenda_item_id: number;
    public tags_id: number[];

    public constructor(input?: any) {
        super(Assignment.COLLECTIONSTRING, input);
    }

    public get candidates_id(): number[] {
        return this.assignment_related_users
            .sort((a: AssignmentUser, b: AssignmentUser) => {
                return a.weight - b.weight;
            })
            .map((candidate: AssignmentUser) => candidate.user_id);
    }

    public deserialize(input: any): void {
        Object.assign(this, input);

        this.assignment_related_users = [];
        if (input.assignment_related_users instanceof Array) {
            this.assignment_related_users = input.assignment_related_users.map(
                assignmentUserData => new AssignmentUser(assignmentUserData)
            );
        }

        this.polls = [];
        if (input.polls instanceof Array) {
            this.polls = input.polls.map(pollData => new Poll(pollData));
        }
    }
}
