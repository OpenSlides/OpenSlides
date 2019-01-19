import { Category } from 'app/shared/models/motions/category';
import { User } from 'app/shared/models/users/user';
import { Workflow } from 'app/shared/models/motions/workflow';
import { WorkflowState } from 'app/shared/models/motions/workflow-state';
import { Item } from 'app/shared/models/agenda/item';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { ViewMotion } from './view-motion';
import { CreateMotion } from './create-motion';

/**
 * Create motion class for the View. Its different to ViewMotion in fact that the submitter handling is different
 * on motion creation.
 *
 * @ignore
 */
export class ViewCreateMotion extends ViewMotion {
    protected _motion: CreateMotion;

    public get motion(): CreateMotion {
        return this._motion;
    }

    public get submitters(): User[] {
        return this._submitters;
    }

    public get submitters_id(): number[] {
        return this.motion ? this.motion.submitters_id : null;
    }

    public set submitters(users: User[]) {
        this._submitters = users;
        this._motion.submitters_id = users.map(user => user.id);
    }

    public constructor(
        motion?: CreateMotion,
        category?: Category,
        submitters?: User[],
        supporters?: User[],
        workflow?: Workflow,
        state?: WorkflowState,
        item?: Item,
        block?: MotionBlock
    ) {
        super(motion, category, submitters, supporters, workflow, state, item, block, null);
    }

    /**
     * Duplicate this motion into a copy of itself
     */
    public copy(): ViewCreateMotion {
        return new ViewCreateMotion(
            this._motion,
            this._category,
            this._submitters,
            this._supporters,
            this._workflow,
            this._state
        );
    }
}
