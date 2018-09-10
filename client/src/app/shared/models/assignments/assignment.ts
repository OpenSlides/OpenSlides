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
        super('assignments/assignment', input);
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

        this.assignment_related_users = [];
        if (input.assignment_related_users instanceof Array) {
            input.assignment_related_users.forEach(assignmentUserData => {
                this.assignment_related_users.push(new AssignmentUser(assignmentUserData));
            });
        }

        this.polls = [];
        if (input.polls instanceof Array) {
            input.polls.forEach(pollData => {
                this.polls.push(new Poll(pollData));
            });
        }
    }
}

BaseModel.registerCollectionElement('assignments/assignment', Assignment);
