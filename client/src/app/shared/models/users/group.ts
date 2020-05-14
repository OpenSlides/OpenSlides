import { Permission } from 'app/core/core-services/operator.service';
import { BaseModel } from '../base/base-model';

/**
 * Representation of user group.
 * @ignore
 */
export class Group extends BaseModel<Group> {
    public static COLLECTIONSTRING = 'users/group';

    public id: number;
    public name: string;
    public permissions: Permission[];

    public constructor(input?: Partial<Group>) {
        super(Group.COLLECTIONSTRING, input);
    }
}
