import { BaseModel } from 'app/core/models/baseModel';

export class Group extends BaseModel {
    static collectionString = 'users/group';
    id: number;
    name: string;
    permissions: string[]; //TODO permissions could be an own model?

    constructor(id: number, name?: string, permissions?: string[]) {
        super(id);
        this.id = id;
        this.name = name;
        this.permissions = permissions;
    }

    public getCollectionString(): string {
        return Group.collectionString;
    }
}
