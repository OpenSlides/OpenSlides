import { BaseViewModel } from '../../base/base-view-model';
import { User } from '../../../shared/models/users/user';
import { Group } from '../../../shared/models/users/group';
import { BaseModel } from '../../../shared/models/base/base-model';

export class ViewUser extends BaseViewModel {
    private _user: User;
    private _groups: Group[];

    public get user(): User {
        return this._user ? this._user : null;
    }

    public get groups(): Group[] {
        return this._groups;
    }

    public get id(): number {
        return this.user ? this.user.id : null;
    }

    public get username(): string {
        return this.user ? this.user.username : null;
    }

    public get title(): string {
        return this.user ? this.user.title : null;
    }

    public get firstName(): string {
        return this.user ? this.user.first_name : null;
    }

    public get lastName(): string {
        return this.user ? this.user.last_name : null;
    }

    public get fullName(): string {
        return this.user ? this.user.full_name : null;
    }

    public get shortName(): string {
        return this.user ? this.user.short_name : null;
    }

    public get email(): string {
        return this.user ? this.user.email : null;
    }

    public get structureLevel(): string {
        return this.user ? this.user.structure_level : null;
    }

    public get participantNumber(): string {
        return this.user ? this.user.number : null;
    }

    public get groupIds(): number[] {
        return this.user ? this.user.groups_id : null;
    }

    /**
     * Required by the input selector
     */
    public set groupIds(ids: number[]) {
        if (this.user) {
            this.user.groups_id = ids;
        }
    }

    public get initialPassword(): string {
        return this.user ? this.user.default_password : null;
    }

    public get comment(): string {
        return this.user ? this.user.comment : null;
    }

    public get isPresent(): boolean {
        return this.user ? this.user.is_present : null;
    }

    public get isActive(): boolean {
        return this.user ? this.user.is_active : null;
    }

    public get isCommittee(): boolean {
        return this.user ? this.user.is_committee : null;
    }

    public get about(): string {
        return this.user ? this.user.about_me : null;
    }

    public constructor(user?: User, groups?: Group[]) {
        super();
        this._user = user;
        this._groups = groups;
    }

    /**
     * required by BaseViewModel. Don't confuse with the users title.
     */
    public getTitle(): string {
        return this.user ? this.user.toString() : null;
    }

    /**
     * TODO: Implement
     */
    public replaceGroup(newGroup: Group): void {}

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
