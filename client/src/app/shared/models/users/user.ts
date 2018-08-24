import { BaseModel } from '../base.model';

/**
 * Representation of a user in contrast to the operator.
 * @ignore
 */
export class User extends BaseModel {
    protected _collectionString: string;
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

    constructor(
        id?: number,
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
        this._collectionString = 'users/user';
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

    getGroups(): BaseModel | BaseModel[] {
        return this.DS.get('users/group', ...this.groups_id);
    }

    //TODO get full_name

    // TODO read config values  for "users_sort_by"
    get short_name(): string {
        const title = this.title.trim();
        const firstName = this.first_name.trim();
        const lastName = this.last_name.trim();
        let shortName = '';

        // TODO need DS adjustment first first
        // if (this.DS.getConfig('users_sort_by').value === 'last_name') {
        //     if (lastName && firstName) {
        //         shortName += `${lastName}, ${firstName}`;
        //     } else {
        //         shortName += lastName || firstName;
        //     }
        // }

        shortName += `${firstName} ${lastName}`;

        if (shortName.trim() === '') {
            shortName = this.username;
        }

        if (title) {
            shortName = `${title} ${shortName}`;
        }

        return shortName.trim();
    }

    public toString = (): string => {
        return this.short_name;
    };
}

BaseModel.registerCollectionElement('users/user', User);
