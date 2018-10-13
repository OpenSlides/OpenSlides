import { BaseViewModel } from '../../base/base-view-model';
import { Group } from '../../../shared/models/users/group';
import { BaseModel } from '../../../shared/models/base/base-model';

export class ViewGroup extends BaseViewModel {
    private _group: Group;

    public get group(): Group {
        return this._group ? this._group : null;
    }

    public get id(): number {
        return this.group ? this.group.id : null;
    }

    public get name(): string {
        return this.group ? this.group.name : null;
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
        return this.group ? this.group.permissions : null;
    }

    public constructor(group?: Group) {
        super();
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

    public getTitle(): string {
        return this.name;
    }

    public updateValues(update: BaseModel): void {
        console.log('ViewGroups wants to update Values with : ', update);
    }
}
