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
        this.identifier = identifier;
        this.versions = versions;
        this.active_version = active_version;
        this.parent_id = parent_id;
        this.category_id = category_id;
        this.motion_block_id = motion_block_id;
        this.origin = origin;
        this.submitters = submitters;
        this.supporters_id = supporters_id;
        this.comments = comments;
        this.state_id = state_id;
        this.state_required_permission_to_see = state_required_permission_to_see;
        this.recommendation_id = recommendation_id;
        this.tags_id = tags_id;
        this.attachments_id = attachments_id;
        this.polls = polls;
        this.agenda_item_id = agenda_item_id;
        this.log_messages = log_messages;

        this.initDataStoreValues();
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

    /**
     * returns the most current title from versions
     */
    get currentTitle() {
        if (this.versions[0]) {
            return this.versions[0].title;
        } else {
            return '';
        }
    }

    /**
     * returns the most current motion text from versions
     */
    get currentText() {
        return this.versions[0].text;
    }

    /**
     * returns the most current motion reason text from versions
     */
    get currentReason() {
        return this.versions[0].reason;
    }

    /**
     * return the submitters as uses objects
     */
    get submitterAsUser() {
        const submitterIds = [];
        this.submitters.forEach(submitter => {
            submitterIds.push(submitter.user_id);
        });
        const users = this.DS.get(User, ...submitterIds);
        return users;
    }

    /**
     * returns the name of the first submitter
     */
    get submitterName() {
        const mainSubmitter = this.DS.get(User, this.submitters[0].user_id) as User;
        if (mainSubmitter) {
            return mainSubmitter;
        } else {
            return '';
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
            return 'none';
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
     *
     * set the workflow via a component
     */
    get state() {
        if (this.workflow && this.workflow.id) {
            const state = this.workflow.state_by_id(this.state_id);
            return state;
        } else {
            return null;
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
     * Right now only the default workflow is assumed
     * TODO: Motion workflow needs to be specific on the server
     */
    get recommendation() {
        const state = this.workflow.state_by_id(this.recommendation_id);
        if (state) {
            return state.recommendation_label;
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
        const recomByString = motionsRecommendationsByConfig.value;
        return recomByString;
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
