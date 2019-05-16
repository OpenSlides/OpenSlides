import { BaseViewModel } from '../../base/base-view-model';
import { Group } from 'app/shared/models/users/group';

export class ViewGroup extends BaseViewModel {
    public static COLLECTIONSTRING = Group.COLLECTIONSTRING;

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

    public hasPermission(perm: string): boolean {
        return this.permissions.includes(perm);
    }

    public getTitle = () => {
        return this.name;
    };

    public getModel(): Group {
        return this.group;
    }

    public updateDependencies(update: BaseViewModel): void {}
}
