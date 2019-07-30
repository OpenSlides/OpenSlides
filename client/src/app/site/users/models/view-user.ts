import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { User } from 'app/shared/models/users/user';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { Searchable } from 'app/site/base/searchable';
import { ViewGroup } from './view-group';

export interface UserTitleInformation {
    username: string;
    title?: string;
    first_name?: string;
    last_name?: string;
    structure_level?: string;
    number?: string;
}

export class ViewUser extends BaseProjectableViewModel<User> implements UserTitleInformation, Searchable {
    public static COLLECTIONSTRING = User.COLLECTIONSTRING;

    private _groups: ViewGroup[];

    public get user(): User {
        return this._model;
    }

    public get groups(): ViewGroup[] {
        return this._groups;
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

    public get short_name(): string {
        if (this.user && this.getShortName) {
            return this.getShortName();
        } else {
            return '';
        }
    }

    public get full_name(): string {
        if (this.user && this.getFullName) {
            return this.getFullName();
        } else {
            return '';
        }
    }

    // Will be set by the repository
    public getFullName: () => string;
    public getShortName: () => string;

    public constructor(user: User) {
        super(User.COLLECTIONSTRING, user);
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
        return `/users/${this.id}`;
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
}
