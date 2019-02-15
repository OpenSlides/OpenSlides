import { User } from 'app/shared/models/users/user';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { Searchable } from 'app/site/base/searchable';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { ViewGroup } from './view-group';
import { BaseViewModel } from 'app/site/base/base-view-model';

export class ViewUser extends BaseProjectableViewModel implements Searchable {
    public static COLLECTIONSTRING = User.COLLECTIONSTRING;

    private _user: User;
    private _groups: ViewGroup[];

    public get user(): User {
        return this._user;
    }

    public get groups(): ViewGroup[] {
        return this._groups;
    }

    public get id(): number {
        return this.user.id;
    }

    public get username(): string {
        return this.user.username;
    }

    public get title(): string {
        return this.user.title;
    }

    public get first_name(): string {
        return this.user.first_name;
    }

    public get last_name(): string {
        return this.user.last_name;
    }

    public get email(): string {
        return this.user.email;
    }

    public get gender(): string {
        return this.user.gender;
    }

    public get structure_level(): string {
        return this.user.structure_level;
    }

    public get number(): string {
        return this.user.number;
    }

    public get groups_id(): number[] {
        return this.user.groups_id;
    }

    /**
     * Required by the input selector
     */
    public set groupIds(ids: number[]) {
        if (this.user) {
            this.user.groups_id = ids;
        }
    }

    public get default_password(): string {
        return this.user.default_password;
    }

    public get comment(): string {
        return this.user.comment;
    }

    public get is_present(): boolean {
        return this.user.is_present;
    }

    public get is_active(): boolean {
        return this.user.is_active;
    }

    public get is_committee(): boolean {
        return this.user.is_committee;
    }

    public get about_me(): string {
        return this.user.about_me;
    }

    public get is_last_email_send(): boolean {
        return this.user && !!this.user.last_email_send;
    }

    // TODO read config values for "users_sort_by"
    /**
     * Getter for the short name (Title, given name, surname)
     *
     * @returns a non-empty string
     */
    public get short_name(): string {
        if (!this.user) {
            return '';
        }

        const title = this.title ? this.title.trim() : '';
        const firstName = this.first_name ? this.first_name.trim() : '';
        const lastName = this.last_name ? this.last_name.trim() : '';

        // TODO need DS adjustment first first
        // if (this.DS.getConfig('users_sort_by').value === 'last_name') {
        //     if (lastName && firstName) {
        //         shortName += `${lastName}, ${firstName}`;
        //     } else {
        //         shortName += lastName || firstName;
        //     }
        // }

        let shortName = `${firstName} ${lastName}`;

        if (shortName.length <= 1) {
            // We have at least one space from the concatination of
            // first- and lastname.
            shortName = this.username;
        }

        if (title) {
            shortName = `${title} ${shortName}`;
        }

        return shortName;
    }

    public get full_name(): string {
        if (!this.user) {
            return '';
        }

        let name = this.short_name;
        const additions: string[] = [];

        // addition: add number and structure level
        const structure_level = this.structure_level ? this.structure_level.trim() : '';
        if (structure_level) {
            additions.push(structure_level);
        }

        const number = this.number ? this.number.trim() : '';
        if (number) {
            // TODO Translate
            additions.push('No. ' + number);
        }

        if (additions.length > 0) {
            name += ' (' + additions.join(' · ') + ')';
        }
        return name.trim();
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(user: User, groups?: ViewGroup[]) {
        super(User.COLLECTIONSTRING);
        this._user = user;
        this._groups = groups;
    }

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        return [this.title, this.first_name, this.last_name, this.structure_level, this.number];
    }

    public getDetailStateURL(): string {
        throw new Error('TODO');
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: User.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'users',
            getDialogTitle: () => this.getTitle()
        };
    }

    /**
     * required by BaseViewModel. Don't confuse with the users title.
     */
    public getTitle = () => {
        return this.full_name;
    };

    public updateDependencies(update: BaseViewModel): void {
        if (update instanceof ViewGroup && this.user.groups_id.includes(update.id)) {
            const groupIndex = this.groups.findIndex(group => group.id === update.id);
            if (groupIndex < 0) {
                this.groups.push(update);
            } else {
                this.groups[groupIndex] = update;
            }
        }
    }
}
