import { BaseViewModel } from '../../base/base-view-model';
import { Group } from 'app/shared/models/users/group';

export interface GroupTitleInformation {
    name: string;
}

export class ViewGroup extends BaseViewModel<Group> implements GroupTitleInformation {
    public static COLLECTIONSTRING = Group.COLLECTIONSTRING;

    public get group(): Group {
        return this._model;
    }

    public get name(): string {
        return this.group.name;
    }

    /**
     * required for renaming purpose
     */
    public set name(newName: string) {
        if (this.group) {
            this.group.name = newName;
        }
    }

    public get permissions(): string[] {
        return this.group.permissions;
    }

    public constructor(group?: Group) {
        super(Group.COLLECTIONSTRING, group);
    }

    public hasPermission(perm: string): boolean {
        return this.permissions.includes(perm);
    }
}
