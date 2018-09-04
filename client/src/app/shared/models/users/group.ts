import { BaseModel } from '../base.model';
import { User } from './user';

/**
 * Representation of user group.
 * @ignore
 */
export class Group extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public name: string;
    public permissions: string[];

    public constructor(input?: any) {
        super();
        this._collectionString = 'users/group';
        if (input) {
            this.deserialize(input);
        }
    }

    public get users() {
        // We have to use the string version to avoid circular dependencies.
        return this.DS.filter<User>('users/user', user => {
            return user.groups_id.includes(this.id);
        });
    }
}

BaseModel.registerCollectionElement('users/group', Group);
