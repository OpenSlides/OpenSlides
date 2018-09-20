import { BaseViewModel } from '../../base/base-view-model';
import { User } from '../../../shared/models/users/user';
import { Group } from '../../../shared/models/users/group';
import { BaseModel } from '../../../shared/models/base/base-model';

export class ViewUser extends BaseViewModel {
    private _user: User;
    private _groups: Group[];

    public get id(): number {
        return this._user ? this._user.id : null;
    }

    public get user(): User {
        return this._user;
    }

    public get groups(): Group[] {
        return this._groups;
    }

    public get fullName(): string {
        return this.user ? this.user.full_name : null;
    }

    /**
     * TODO: Make boolean, use function over view component.
     */
    public get isActive(): string {
        return this.user && this.user.is_active ? 'active' : 'inactive';
    }

    public get structureLevel(): string {
        return this.user ? this.user.structure_level : null;
    }

    public constructor(user?: User, groups?: Group[]) {
        super();
        this._user = user;
        this._groups = groups;
    }

    public getTitle(): string {
        return this.user ? this.user.toString() : null;
    }

    /**
     * TODO: Implement
     */
    public replaceGroup(newGroup: Group): void {
        console.log('replace group - not yet implemented, ', newGroup);
    }

    public updateValues(update: BaseModel): void {
        if (update instanceof Group) {
            this.updateGroup(update as Group);
        }
        if (update instanceof User) {
            this.updateUser(update as User);
        }
    }

    public updateGroup(update: Group): void {
        if (this.user && this.user.groups_id) {
            if (this.user.containsGroupId(update.id)) {
                this.replaceGroup(update);
            }
        }
    }
    /**
     * Updates values. Triggered through observables.
     *
     * @param update a new User or Group
     */
    public updateUser(update: User): void {
        if (this.user.id === update.id) {
            this._user = update;
        }
    }
}
