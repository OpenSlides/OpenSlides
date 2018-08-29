import { BaseModel } from '../base.model';
import { AssignmentUser } from './assignment-user';
import { Poll } from './poll';

/**
 * Representation of an assignment.
 * @ignore
 */
export class Assignment extends BaseModel {
    protected _collectionString: string;
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

    public constructor(
        id?: number,
        title?: string,
        description?: string,
        open_posts?: number,
        phase?: number,
        assignment_related_users?: AssignmentUser[],
        poll_description_default?: number,
        polls?: Poll[],
        agenda_item_id?: number,
        tags_id?: number[]
    ) {
        super();
        this._collectionString = 'assignments/assignment';
        this.id = id;
        this.title = title;
        this.description = description;
        this.open_posts = open_posts;
        this.phase = phase;
        this.assignment_related_users = assignment_related_users || []; // TODO Array
        this.poll_description_default = poll_description_default;
        this.polls = polls || Array(); // TODO Array
        this.agenda_item_id = agenda_item_id;
        this.tags_id = tags_id;
    }

    public getAssignmentReleatedUsers(): BaseModel | BaseModel[] {
        const userIds = [];
        this.assignment_related_users.forEach(user => {
            userIds.push(user.user_id);
        });
        return this.DS.get('users/user', ...userIds);
    }

    public getTags(): BaseModel | BaseModel[] {
        return this.DS.get('core/tag', ...this.tags_id);
    }

    public deserialize(input: any): this {
        Object.assign(this, input);

        if (input.assignment_related_users instanceof Array) {
            this.assignment_related_users = [];
            input.assignment_related_users.forEach(assignmentUserData => {
                this.assignment_related_users.push(new AssignmentUser().deserialize(assignmentUserData));
            });
        }

        if (input.polls instanceof Array) {
            this.polls = [];
            input.polls.forEach(pollData => {
                this.polls.push(new Poll().deserialize(pollData));
            });
        }
        return this;
    }
}

BaseModel.registerCollectionElement('assignments/assignment', Assignment);
