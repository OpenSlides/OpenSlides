import { BaseViewModel } from '../../base/base-view-model';
import { Group } from 'app/shared/models/users/group';

export class ViewGroup extends BaseViewModel {
    private _group: Group;

    public get group(): Group {
        return this._group;
    }

    public get id(): number {
        return this.group.id;
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

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(group?: Group) {
        super(Group.COLLECTIONSTRING);
        this._group = group;
    }

    /**
     * Returns an array of permissions where the given perm is included
     * or removed.
     *
     * Avoids touching the local DataStore.
     *
     * @param perm
     */
    public getAlteredPermissions(perm: string): string[] {
        // clone the array, avoids altering the local dataStore
        const currentPermissions = this.permissions.slice();

        if (this.hasPermission(perm)) {
            // remove the permission from currentPermissions-List
            const indexOfPerm = currentPermissions.indexOf(perm);
            if (indexOfPerm !== -1) {
                currentPermissions.splice(indexOfPerm, 1);
                return currentPermissions;
            } else {
                return currentPermissions;
            }
        } else {
            currentPermissions.push(perm);
            return currentPermissions;
        }
    }

    public hasPermission(perm: string): boolean {
        return this.permissions.includes(perm);
    }

    public getTitle = () => {
        return this.name;
    };

    public updateDependencies(update: BaseViewModel): void {
        console.log('ViewGroups wants to update Values with : ', update);
    }
}
