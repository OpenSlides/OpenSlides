import { Motion } from '../../../shared/models/motions/motion';
import { Category } from '../../../shared/models/motions/category';
import { User } from '../../../shared/models/users/user';
import { Workflow } from '../../../shared/models/motions/workflow';
import { WorkflowState } from '../../../shared/models/motions/workflow-state';
import { BaseModel } from '../../../shared/models/base/base-model';
import { BaseViewModel } from '../../base-view-model';
import { TranslateService } from '@ngx-translate/core';

/**
 * Motion class for the View
 *
 * Stores a motion including all (implicit) references
 * Provides "safe" access to variables and functions in {@link Motion}
 * @ignore
 */
export class ViewMotion extends BaseViewModel {
    private _motion: Motion;
    private _category: Category;
    private _submitters: User[];
    private _supporters: User[];
    private _workflow: Workflow;
    private _state: WorkflowState;

    public get motion(): Motion {
        return this._motion;
    }

    public get id(): number {
        if (this.motion) {
            return this.motion.id;
        } else {
            return null;
        }
    }

    public get identifier(): string {
        if (this.motion) {
            return this.motion.identifier;
        } else {
            return null;
        }
    }

    public get title(): string {
        if (this.motion) {
            return this.motion.title;
        } else {
            return null;
        }
    }

    public get text(): string {
        if (this.motion) {
            return this.motion.text;
        } else {
            return null;
        }
    }

    public get reason(): string {
        if (this.motion) {
            return this.motion.reason;
        } else {
            return null;
        }
    }

    public get category(): Category {
        return this._category;
    }

    public get categoryId(): number {
        if (this._motion && this._motion.category_id) {
            return this._motion.category_id;
        } else {
            return null;
        }
    }

    public get submitters(): User[] {
        return this._submitters;
    }

    public get supporters(): User[] {
        return this._supporters;
    }

    public get workflow(): Workflow {
        return this._workflow;
    }

    public get state(): WorkflowState {
        return this._state;
    }

    public get stateId(): number {
        if (this._motion && this._motion.state_id) {
            return this._motion.state_id;
        } else {
            return null;
        }
    }

    public get recommendationId(): number {
        return this._motion.recommendation_id;
    }

    /**
     * FIXME:
     * name of recommender exist in a config
     * previously solved using `this.DS.filter<Config>(Config)`
     * and checking: motionsRecommendationsByConfig.value
     *
     */
    public get recommender(): string {
        return null;
    }

    public get recommendation(): WorkflowState {
        if (this.recommendationId && this.workflow) {
            return this.workflow.getStateById(this.recommendationId);
        } else {
            return null;
        }
    }

    public get origin(): string {
        if (this.motion) {
            return this.motion.origin;
        } else {
            return null;
        }
    }

    public get nextStates(): WorkflowState[] {
        if (this.state && this.workflow) {
            return this.state.getNextStates(this.workflow);
        } else {
            return null;
        }
    }

    public constructor(
        motion?: Motion,
        category?: Category,
        submitters?: User[],
        supporters?: User[],
        workflow?: Workflow,
        state?: WorkflowState
    ) {
        super();

        this._motion = motion;
        this._category = category;
        this._submitters = submitters;
        this._supporters = supporters;
        this._workflow = workflow;
        this._state = state;
    }

    public getTitle(translate?: TranslateService): string {
        return this.title;
    }

    /**
     * Updates the local objects if required
     * @param update
     */
    public updateValues(update: BaseModel): void {
        if (update instanceof Workflow) {
            if (this.motion && update.id === this.motion.workflow_id) {
                this._workflow = update as Workflow;
            }
        } else if (update instanceof Category) {
            if (this.motion && update.id === this.motion.category_id) {
                this._category = update as Category;
            }
        }
        // TODO: There is no way (yet) to add Submitters to a motion
        //       Thus, this feature could not be tested
    }

    public hasSupporters(): boolean {
        return !!(this.supporters && this.supporters.length > 0);
    }

    /**
     * Duplicate this motion into a copy of itself
     */
    public copy(): ViewMotion {
        return new ViewMotion(
            this._motion,
            this._category,
            this._submitters,
            this._supporters,
            this._workflow,
            this._state
        );
    }
}
