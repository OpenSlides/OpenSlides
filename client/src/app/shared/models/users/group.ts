import { BaseModel } from '../base.model';
import { User } from './user';

/**
 * Representation of user group.
 * @ignore
 */
export class Group extends BaseModel {
    public id: number;
    public name: string;
    public permissions: string[];

    public constructor(input?: any) {
        super('users/group', input);
    }

    public get users(): User[] {
        // We have to use the string version to avoid circular dependencies.
        return this.DS.filter<User>('users/user', user => {
            return user.groups_id.includes(this.id);
        });
    }

    public toString(): string {
        return this.name;
    }
}

BaseModel.registerCollectionElement('users/group', Group);
