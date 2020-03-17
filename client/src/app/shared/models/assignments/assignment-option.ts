import { BaseOption } from '../poll/base-option';

export class AssignmentOption extends BaseOption<AssignmentOption> {
    public static COLLECTIONSTRING = 'assignments/assignment-option';

    public user_id: number;
    public weight: number;

    public constructor(input?: any) {
        super(AssignmentOption.COLLECTIONSTRING, input);
    }
}
