import { BaseModel } from 'app/core/models/base-model';

/**
 * Representation of user group.
 * @ignore
 */
export class Group extends BaseModel {
    protected _collectionString: string;
    id: number;
    name: string;
    permissions: string[];

    constructor(id?: number, name?: string, permissions?: string[]) {
        super();
        this._collectionString = 'users/group';
        this.id = id;
        this.name = name;
        this.permissions = permissions;
    }
}
