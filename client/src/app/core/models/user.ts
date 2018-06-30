import { BaseModel } from './baseModel';

export class User extends BaseModel {
    id: number;
    username: string;
    title: string;
    first_name: string;
    last_name: string;
    structure_level: string;
    number: string;
    about_me: string;
    groups_id: number[];
    is_present: boolean;
    is_committee: boolean;
    email: string;
    last_email_send?: string;
    comment: string;
    is_active: boolean;
    default_password: string;

    constructor(id: number) {
        super();
        this.id = id;
    }

    static getCollectionString(): string {
        return 'users/user';
    }
    // Make this static lookup methods typesafe
    // TODO: I'm not happy about this:
    // - this has to be done for every model
    // - this may be extendet, if there are more static functionallities for models.
    static get(id: number): User | undefined {
        return this._get<User>(id);
    }
    static getAll(): User[] {
        return this._getAll<User>();
    }
    static filter(callback): User[] {
        return this._filter<User>(callback);
    }

    getCollectionString(): string {
        return 'users/user';
    }
}
