import { BaseModel } from './baseModel';

export class Group extends BaseModel {
    id: number;
    name: string;
    permissions: string[]; //TODO permissions could be an own model?

    constructor(id: number, name?: string, permissions?: string[]) {
        super();
        this.id = id;
        this.name = name;
        this.permissions = permissions;
    }

    getCollectionString(): string {
        return 'users/group';
    }
}
