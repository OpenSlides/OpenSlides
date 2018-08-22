import { BaseModel } from '../base.model';
import { MotionVersion } from './motion-version';
import { MotionSubmitter } from './motion-submitter';
import { MotionLog } from './motion-log';
import { Config } from '../core/config';
import { Workflow } from './workflow';
import { User } from '../users/user';
import { Category } from './category';
import { WorkflowState } from './workflow-state';

/**
 * Representation of Motion.
 *
 * Slightly Defined cause heavy maintaince on server side.
 *
 * @ignore
 */
export class Motion extends BaseModel {
    protected _collectionString: string;
    id: number;
    identifier: string;
    versions: MotionVersion[];
    active_version: number;
    parent_id: number;
    category_id: number;
    motion_block_id: number;
    origin: string;
    submitters: MotionSubmitter[];
    supporters_id: number[];
    comments: Object;
    state_id: number;
    state_required_permission_to_see: string;
    recommendation_id: number;
    tags_id: number[];
    attachments_id: number[];
    polls: BaseModel[];
    agenda_item_id: number;
    log_messages: MotionLog[];

    // read from config
    workflow_id: number;
    // by the config above
    workflow: Workflow;

    // for request
    title: string;
    text: string;

    constructor(
        id?: number,
        identifier?: string,
        versions?: MotionVersion[],
        active_version?: number,
        parent_id?: number,
        category_id?: number,
        motion_block_id?: number,
        origin?: string,
        submitters?: MotionSubmitter[],
        supporters_id?: number[],
        comments?: Object,
        state_id?: number,
        state_required_permission_to_see?: string,
        recommendation_id?: number,
        tags_id?: number[],
        attachments_id?: number[],
        polls?: BaseModel[],
        agenda_item_id?: number,
        log_messages?: MotionLog[]
    ) {
        super();
        this._collectionString = 'motions/motion';
        this.id = id;
        this.identifier = identifier || '';
        this.versions = versions || [new MotionVersion()];
        this.active_version = active_version;
        this.parent_id = parent_id;
        this.category_id = category_id;
        this.motion_block_id = motion_block_id;
        this.origin = origin || '';
        this.submitters = submitters || [];
        this.supporters_id = supporters_id;
        this.comments = comments;
        this.state_id = state_id;
        this.state_required_permission_to_see = state_required_permission_to_see || '';
        this.recommendation_id = recommendation_id;
        this.tags_id = tags_id;
        this.attachments_id = attachments_id;
        this.polls = polls;
        this.agenda_item_id = agenda_item_id;
        this.log_messages = log_messages || [];

        this.initDataStoreValues();
    }

    /**
     * update the values of the motion with new values
     */
    patchValues(update: object) {
        Object.assign(this, update);
    }

    /**
     * sets the workflow_id and the workflow
     */
    initDataStoreValues() {
        const motionsWorkflowConfig = this.DS.filter(Config, config => config.key === 'motions_workflow')[0] as Config;
        if (motionsWorkflowConfig) {
            this.workflow_id = +motionsWorkflowConfig.value;
        } else {
            this.DS.getObservable().subscribe(newConfig => {
                if (newConfig instanceof Config && newConfig.key === 'motions_workflow') {
                    this.workflow_id = +newConfig.value;
                }
            });
        }

        this.workflow = this.DS.get(Workflow, this.workflow_id) as Workflow;
        if (!this.workflow.id) {
            this.DS.getObservable().subscribe(newModel => {
                if (newModel instanceof Workflow && newModel.id === this.workflow_id) {
                    this.workflow = newModel;
                }
            });
        }
    }

    /** add a new motionSubmitter from user-object */
    addSubmitter(user: User) {
        const newSubmitter = new MotionSubmitter(null, user.id);
        this.submitters.push(newSubmitter);
        console.log('did addSubmitter. this.submitters: ', this.submitters);
    }

    /**
     * returns the most current title from versions
     */
    get currentTitle(): string {
        if (this.versions && this.versions[0]) {
            return this.versions[0].title;
        } else {
            return '';
        }
    }

    set currentTitle(newTitle: string) {
        if (this.versions[0]) {
            this.versions[0].title = newTitle;
        }
    }

    /**
     * returns the most current motion text from versions
     */
    get currentText() {
        if (this.versions) {
            return this.versions[0].text;
        } else {
            return null;
        }
    }

    set currentText(newText: string) {
        this.versions[0].text = newText;
    }

    /**
     * returns the most current motion reason text from versions
     */
    get currentReason() {
        if (this.versions) {
            return this.versions[0].reason;
        } else {
            return null;
        }
    }

    /**
     * Update the current reason.
     * TODO: ignores motion versions. Should make a new one.
     */
    set currentReason(newReason: string) {
        this.versions[0].reason = newReason;
    }

    /**
     * return the submitters as uses objects
     */
    get submitterAsUser() {
        const submitterIds = [];
        if (this.submitters && this.submitters.length > 0) {
            this.submitters.forEach(submitter => {
                submitterIds.push(submitter.user_id);
            });
            const users = this.DS.get(User, ...submitterIds);
            return users;
        } else {
            return null;
        }
    }

    /**
     * get the category of a motion as object
     */
    get category(): any {
        if (this.category_id) {
            const motionCategory = this.DS.get(Category, this.category_id);
            return motionCategory as Category;
        } else {
            return '';
        }
    }

    /**
     * Set the category in the motion
     */
    set category(newCategory: any) {
        this.category_id = newCategory.id;
    }

    /**
     * return the workflow state
     */
    get state(): any {
        if (this.state_id && this.workflow && this.workflow.id) {
            const state = this.workflow.state_by_id(this.state_id);
            return state;
        } else {
            return '';
        }
    }

    /**
     * returns possible states for the motion
     */
    get possible_states(): WorkflowState[] {
        return this.workflow.states;
    }

    /**
     * Returns the name of the recommendation.
     *
     * TODO: Motion workflow needs to be specific on the server
     */
    get recommendation(): any {
        if (this.recommendation_id && this.workflow && this.workflow.id) {
            const state = this.workflow.state_by_id(this.recommendation_id);
            return state;
        } else {
            return '';
        }
    }

    /**
     * returns the value of 'config.motions_recommendations_by'
     */
    get recomBy() {
        const motionsRecommendationsByConfig = this.DS.filter(
            Config,
            config => config.key === 'motions_recommendations_by'
        )[0] as Config;

        if (motionsRecommendationsByConfig) {
            const recomByString = motionsRecommendationsByConfig.value;
            return recomByString;
        } else {
            return null;
        }
    }

    deserialize(input: any): this {
        Object.assign(this, input);

        if (input.versions instanceof Array) {
            this.versions = [];
            input.versions.forEach(motionVersionData => {
                this.versions.push(new MotionVersion().deserialize(motionVersionData));
            });
        }

        if (input.submitters instanceof Array) {
            this.submitters = [];
            input.submitters.forEach(SubmitterData => {
                this.submitters.push(new MotionSubmitter().deserialize(SubmitterData));
            });
        }

        if (input.log_messages instanceof Array) {
            this.log_messages = [];
            input.log_messages.forEach(logData => {
                this.log_messages.push(new MotionLog().deserialize(logData));
            });
        }

        return this;
    }
}
