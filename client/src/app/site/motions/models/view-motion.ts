import { Motion } from '../../../shared/models/motions/motion';
import { Category } from '../../../shared/models/motions/category';
import { User } from '../../../shared/models/users/user';
import { Workflow } from '../../../shared/models/motions/workflow';
import { WorkflowState } from '../../../shared/models/motions/workflow-state';
import { BaseModel } from '../../../shared/models/base/base-model';
import { BaseViewModel } from '../../base/base-view-model';
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
        return this.motion ? this.motion.id : null;
    }

    public get identifier(): string {
        return this.motion ? this.motion.identifier : null;
    }

    public get title(): string {
        return this.motion ? this.motion.title : null;
    }

    public get text(): string {
        return this.motion ? this.motion.text : null;
    }

    public get reason(): string {
        return this.motion ? this.motion.reason : null;
    }

    public get category(): Category {
        return this._category;
    }

    public get categoryId(): number {
        return this.motion && this.category ? this.motion.category_id : null;
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
        return this.motion && this.motion.state_id ? this.motion.state_id : null;
    }

    public get recommendationId(): number {
        return this.motion && this.motion.recommendation_id ? this.motion.recommendation_id : null;
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
        return this.recommendationId && this.workflow ? this.workflow.getStateById(this.recommendationId) : null;
    }

    public get origin(): string {
        return this.motion ? this.motion.origin : null;
    }

    public get nextStates(): WorkflowState[] {
        return this.state && this.workflow ? this.state.getNextStates(this.workflow) : null;
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
