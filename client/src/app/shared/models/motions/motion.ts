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
    public id: number;
    public identifier: string;
    public versions: MotionVersion[];
    public active_version: number;
    public parent_id: number;
    public category_id: number;
    public motion_block_id: number;
    public origin: string;
    public submitters: MotionSubmitter[];
    public supporters_id: number[];
    public comments: Object;
    public state_id: number;
    public state_required_permission_to_see: string;
    public recommendation_id: number;
    public tags_id: number[];
    public attachments_id: number[];
    public polls: BaseModel[];
    public agenda_item_id: number;
    public log_messages: MotionLog[];

    // dynamic values
    public workflow: Workflow;

    // for request
    public title: string;
    public text: string;

    public constructor(
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
    public patchValues(update: object) {
        Object.assign(this, update);
    }

    /**
     * sets the and the workflow from either dataStore or WebSocket
     */
    public initDataStoreValues() {
        // check the containing Workflows in DataStore
        const allWorkflows = this.DS.get(Workflow) as Workflow[];
        allWorkflows.forEach(localWorkflow => {
            if (localWorkflow.isStateContained(this.state_id)) {
                this.workflow = localWorkflow as Workflow;
            }
        });

        // observe for new models
        this.DS.getObservable().subscribe(newModel => {
            if (newModel instanceof Workflow) {
                if (newModel.isStateContained(this.state_id)) {
                    this.workflow = newModel as Workflow;
                }
            }
        });
    }

    /**
     * add a new motionSubmitter from user-object
     * @param user the user
     */
    public addSubmitter(user: User) {
        const newSubmitter = new MotionSubmitter(null, user.id);
        this.submitters.push(newSubmitter);
        console.log('did addSubmitter. this.submitters: ', this.submitters);
    }

    /**
     * returns the most current title from versions
     */
    public get currentTitle(): string {
        if (this.versions && this.versions[0]) {
            return this.versions[0].title;
        } else {
            return '';
        }
    }

    /**
     * Patch the current version
     *
     * TODO: Altering the current version should be avoided.
     */
    public set currentTitle(newTitle: string) {
        if (this.versions[0]) {
            this.versions[0].title = newTitle;
        }
    }

    /**
     * returns the most current motion text from versions
     */
    public get currentText() {
        if (this.versions) {
            return this.versions[0].text;
        } else {
            return null;
        }
    }

    public set currentText(newText: string) {
        this.versions[0].text = newText;
    }

    /**
     * returns the most current motion reason text from versions
     */
    public get currentReason() {
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
    public set currentReason(newReason: string) {
        this.versions[0].reason = newReason;
    }

    /**
     * return the submitters as uses objects
     */
    public get submitterAsUser() {
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
    public get category(): any {
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
    public set category(newCategory: any) {
        this.category_id = newCategory.id;
    }

    /**
     * return the workflow state
     */
    public get state(): any {
        if (this.workflow) {
            return this.workflow.state_by_id(this.state_id);
        } else {
            return '';
        }
    }

    /**
     * returns possible states for the motion
     */
    public get nextStates(): WorkflowState[] {
        if (this.workflow && this.state) {
            return this.state.getNextStates(this.workflow);
        } else {
            return null;
        }
    }

    /**
     * Returns the name of the recommendation.
     *
     * TODO: Motion workflow needs to be specific on the server
     */
    public get recommendation(): any {
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
    public get recomBy() {
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

    public deserialize(input: any): this {
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

BaseModel.registerCollectionElement('motions/motion', Motion);
