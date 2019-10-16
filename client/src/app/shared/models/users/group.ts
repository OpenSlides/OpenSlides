import { BaseModel } from '../base/base-model';

/**
 * Representation of user group.
 * @ignore
 */
export class Group extends BaseModel<Group> {
    public static COLLECTIONSTRING = 'users/group';

    public id: number;
    public name: string;
    public permissions: string[];

    public constructor(input?: Partial<Group>) {
        super(Group.COLLECTIONSTRING, input);
    }
}
