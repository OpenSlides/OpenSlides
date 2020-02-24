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

    public get user(): User {
        return this._model;
    }

    public get isSamlUser(): boolean {
        return this.auth_type === 'saml';
    }

    public get isLastEmailSend(): boolean {
        return !!this.user.last_email_send;
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
    public getLevelAndNumber: () => string;

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        const properties = [
            { key: 'Title', value: this.getTitle() },
            { key: 'First name', value: this.first_name },
            { key: 'Last name', value: this.last_name },
            { key: 'Structure level', value: this.structure_level },
            { key: 'Number', value: this.number }
        ];
        return { properties, searchValue: properties.map(property => property.value) };
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
interface IUserRelations {
    groups: ViewGroup[];
}

export interface ViewUser extends User, IUserRelations {}
