import { WorkflowState } from 'app/shared/models/motions/workflow-state';
import { ViewMotion } from './view-motion';
import { CreateMotion } from './create-motion';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewMotionBlock } from './view-motion-block';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewCategory } from './view-category';
import { ViewWorkflow } from './view-workflow';

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

    public get submitters(): ViewUser[] {
        return this._submitters;
    }

    public get submitters_id(): number[] {
        return this.motion ? this.motion.submitters_id : null;
    }

    public set submitters(users: ViewUser[]) {
        this._submitters = users;
        this._motion.submitters_id = users.map(user => user.id);
    }

    public constructor(
        motion?: CreateMotion,
        category?: ViewCategory,
        submitters?: ViewUser[],
        supporters?: ViewUser[],
        workflow?: ViewWorkflow,
        state?: WorkflowState,
        item?: ViewItem,
        block?: ViewMotionBlock
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
