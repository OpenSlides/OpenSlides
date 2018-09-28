import { Motion } from '../../../shared/models/motions/motion';
import { Category } from '../../../shared/models/motions/category';
import { User } from '../../../shared/models/users/user';
import { Workflow } from '../../../shared/models/motions/workflow';
import { WorkflowState } from '../../../shared/models/motions/workflow-state';
import { BaseModel } from '../../../shared/models/base/base-model';
import { BaseViewModel } from '../../base/base-view-model';
import { TranslateService } from '@ngx-translate/core';

enum LineNumbering {
    None,
    Inside,
    Outside
}

enum ChangeReco {
    Original,
    Change,
    Diff,
    Final
}

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

    /**
     * Indicates the LineNumbering Mode.
     * Needs to be accessed from outside
     */
    public lnMode: LineNumbering;

    /**
     * Indicates the Change reco Mode.
     * Needs to be accessed from outside
     */
    public crMode: ChangeReco;

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

    public get submitterIds(): number[] {
        return this.motion ? this.motion.submitters_id : null;
    }

    public get supporters(): User[] {
        return this._supporters;
    }

    public get supporterIds(): number[] {
        return this.motion ? this.motion.supporters_id : null;
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

    public set supporters(users: User[]) {
        const userIDArr: number[] = [];
        users.forEach(user => {
            userIDArr.push(user.id);
        });
        this._supporters = users;
        this._motion.supporters_id = userIDArr;
    }

    public set submitters(users: User[]) {
        // For the newer backend with weight:
        // const submitterArr: MotionSubmitter[] = []
        // users.forEach(user => {
        //      const motionSub = new MotionSubmitter();
        //     submitterArr.push(motionSub);
        // });
        // this._motion.submitters = submitterArr;
        this._submitters = users;
        const submitterIDArr: number[] = [];
        // for the older backend:
        users.forEach(user => {
            submitterIDArr.push(user.id);
        });
        this._motion.submitters_id = submitterIDArr;
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

        // TODO: Should be set using a a config variable
        this.lnMode = LineNumbering.None;
        this.crMode = ChangeReco.Original;
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
            this.updateWorkflow(update as Workflow);
        } else if (update instanceof Category) {
            this.updateCategory(update as Category);
        }
        // TODO: There is no way (yet) to add Submitters to a motion
        //       Thus, this feature could not be tested
    }

    /**
     * Updates the Category
     */
    public updateCategory(update: Category): void {
        if (this.motion && update.id === this.motion.category_id) {
            this._category = update as Category;
        }
    }

    /**
     * updates the Workflow
     */
    public updateWorkflow(update: Workflow): void {
        if (this.motion && update.id === this.motion.workflow_id) {
            this._workflow = update as Workflow;
        }
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
