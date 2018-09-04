import { BaseModel } from '../base.model';
import { AssignmentUser } from './assignment-user';
import { Poll } from './poll';
import { Tag } from '../core/tag';
import { User } from '../users/user';

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

    public constructor(input?: any) {
        super();
        this._collectionString = 'assignments/assignment';
        this.assignment_related_users = []; // TODO Array
        this.polls = Array(); // TODO Array

        if (input) {
            this.deserialize(input);
        }
    }

    public getAssignmentReleatedUsers(): BaseModel | BaseModel[] {
        const userIds = [];
        this.assignment_related_users.forEach(user => {
            userIds.push(user.user_id);
        });
        return this.DS.getMany<User>('users/user', userIds);
    }

    public getTags(): BaseModel | BaseModel[] {
        return this.DS.getMany<Tag>('core/tag', this.tags_id);
    }

    public deserialize(input: any): void {
        Object.assign(this, input);

        if (input.assignment_related_users instanceof Array) {
            this.assignment_related_users = [];
            input.assignment_related_users.forEach(assignmentUserData => {
                this.assignment_related_users.push(new AssignmentUser(assignmentUserData));
            });
        }

        if (input.polls instanceof Array) {
            this.polls = [];
            input.polls.forEach(pollData => {
                this.polls.push(new Poll(pollData));
            });
        }
    }
}

BaseModel.registerCollectionElement('assignments/assignment', Assignment);
