import { ProjectableBaseModel } from '../base/projectable-base-model';
import { Searchable } from '../base/searchable';
import { SearchRepresentation } from '../../../core/services/search.service';

/**
 * Representation of a user in contrast to the operator.
 * @ignore
 */
export class User extends ProjectableBaseModel implements Searchable {
    public id: number;
    public username: string;
    public title: string;
    public first_name: string;
    public last_name: string;
    public structure_level: string;
    public number: string;
    public about_me: string;
    public groups_id: number[];
    public is_present: boolean;
    public is_committee: boolean;
    public email: string;
    public last_email_send?: string;
    public comment: string;
    public is_active: boolean;
    public default_password: string;

    public constructor(input?: any) {
        super('users/user', 'Participant', input);
    }

    public get full_name(): string {
        let name = this.short_name;
        const addition: string[] = [];

        // addition: add number and structure level
        const structure_level = this.structure_level.trim();
        if (structure_level) {
            addition.push(structure_level);
        }

        const number = this.number ? this.number.trim() : null;
        if (number) {
            // TODO Translate
            addition.push('No.' + ' ' + number);
        }

        if (addition.length > 0) {
            name += ' (' + addition.join(' · ') + ')';
        }
        return name.trim();
    }

    public containsGroupId(id: number): boolean {
        return this.groups_id.some(groupId => groupId === id);
    }

    // TODO read config values  for "users_sort_by"
    public get short_name(): string {
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

    public getTitle(): string {
        return this.full_name;
    }

    public getListViewTitle(): string {
        return this.short_name;
    }

    public getDetailStateURL(): string {
        return `/users/${this.id}`;
    }

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        return [this.title, this.first_name, this.last_name, this.structure_level, this.number];
    }
}
