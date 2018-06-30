import { BaseModel } from './baseModel';

export class Group extends BaseModel {
    id: number;
    name: string;
    permissions: string[];

    constructor(id: number) {
        super();
        this.id = id;
    }

    static getCollectionString(): string {
        return 'users/group';
    }
    static get(id: number): Group | undefined {
        return this._get<Group>(id);
    }
    static getAll(): Group[] {
        return this._getAll<Group>();
    }
    static filter(callback): Group[] {
        return this._filter<Group>(callback);
    }

    getCollectionString(): string {
        return 'users/group';
    }
}
