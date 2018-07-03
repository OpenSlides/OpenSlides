import { BaseModel } from './baseModel';

// import { DS } from 'app/core/services/DS.service';

export class User extends BaseModel {
    //TODO potentially make them private and use getters and setters
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

    //default constructer with every possible optinal parameter for conventient usage
    constructor(
        id: number,
        username?: string,
        title?: string,
        first_name?: string,
        last_name?: string,
        structure_level?: string,
        number?: string,
        about_me?: string,
        groups_id?: number[],
        is_present?: boolean,
        is_committee?: boolean,
        email?: string,
        last_email_send?: string,
        comment?: string,
        is_active?: boolean,
        default_password?: string
    ) {
        super();
        this.id = id;
        this.username = username;
        this.title = title;
        this.first_name = first_name;
        this.last_name = last_name;
        this.structure_level = structure_level;
        this.number = number;
        this.about_me = about_me;
        this.groups_id = groups_id;
        this.is_present = is_present;
        this.is_committee = is_committee;
        this.email = email;
        this.last_email_send = last_email_send;
        this.comment = comment;
        this.is_active = is_active;
        this.default_password = default_password;
    }

    getCollectionString(): string {
        return 'users/user';
    }

    // // convert an serialized version of the User to an instance of the class
    // static fromJSON(jsonString: {}): User {
    //     // create an instance of the User class
    //     let user = Object.create(User.prototype);
    //     // copy all the fields from the json object
    //     return Object.assign(user, jsonString);
    // }
}
