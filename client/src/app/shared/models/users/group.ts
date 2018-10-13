import { BaseModel } from '../base/base-model';

/**
 * Representation of user group.
 * @ignore
 */
export class Group extends BaseModel<Group> {
    public id: number;
    public name: string;
    public permissions: string[];

    public constructor(input?: any) {
        super('users/group', input);
        if (!input) {
            // permissions are required for new groups
            this.permissions = [];
        }
    }

    public getTitle(): string {
        return this.name;
    }
}
