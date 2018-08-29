import { BaseModel } from '../base.model';

/**
 * Representation of user group.
 * @ignore
 */
export class Group extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public name: string;
    public permissions: string[];

    public constructor(id?: number, name?: string, permissions?: string[]) {
        super();
        this._collectionString = 'users/group';
        this.id = id;
        this.name = name;
        this.permissions = permissions;
    }
}

BaseModel.registerCollectionElement('users/group', Group);
