import { BaseModel } from '../base.model';
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
    public title: string;
    public text: string;
    public reason: string;
    public amendment_paragraphs: string;
    public modified_final_version: string;
    public parent_id: number;
    public category_id: number;
    public motion_block_id: number;
    public origin: string;
    public submitters: MotionSubmitter[];
    public supporters_id: number[];
    public comments: Object[];
    public state_id: number;
    public state_extension: string;
    public state_required_permission_to_see: string;
    public recommendation_id: number;
    public recommendation_extension: string;
    public tags_id: number[];
    public attachments_id: number[];
    public polls: BaseModel[];
    public agenda_item_id: number;
    public log_messages: MotionLog[];

    // dynamic values
    public workflow: Workflow;

    public constructor(input?: any) {
        super();
        this._collectionString = 'motions/motion';
        this.identifier = '';
        this.title = '';
        this.text = '';
        this.reason = '';
        this.modified_final_version = '';
        this.origin = '';
        this.submitters = [];
        this.supporters_id = [];
        this.state_required_permission_to_see = '';
        this.log_messages = [];

        if (input) {
            this.deserialize(input);
        }
        this.initDataStoreValues();
    }

    /**
     * update the values of the motion with new values
     */
    public patchValues(update: object): void {
        Object.assign(this, update);
    }

    /**
     * sets the and the workflow from either dataStore or WebSocket
     */
    public initDataStoreValues(): void {
        // check the containing Workflows in DataStore
        const allWorkflows = this.DS.getAll(Workflow);
        allWorkflows.forEach(localWorkflow => {
            if (localWorkflow.isStateContained(this.state_id)) {
                this.workflow = localWorkflow as Workflow;
            }
        });

        // observe for new models
        this.DS.changeObservable.subscribe(newModel => {
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
    public addSubmitter(user: User): void {
        const newSubmitter = new MotionSubmitter();
        newSubmitter.user_id = user.id;
        this.submitters.push(newSubmitter);
        console.log('did addSubmitter. this.submitters: ', this.submitters);
    }

    /**
     * return the submitters as uses objects
     */
    public get submitterAsUser(): User[] {
        const submitterIds: number[] = this.submitters
            .sort((a: MotionSubmitter, b: MotionSubmitter) => {
                return a.weight - b.weight;
            })
            .map((submitter: MotionSubmitter) => submitter.user_id);
        return this.DS.getMany<User>('users/user', submitterIds);
    }

    /**
     * get the category of a motion as object
     */
    public get category(): Category {
        return this.DS.get<Category>(Category, this.category_id);
    }

    /**
     * Set the category in the motion
     */
    public set category(newCategory: Category) {
        this.category_id = newCategory.id;
    }

    /**
     * return the workflow state
     */
    public get state(): WorkflowState {
        if (this.workflow) {
            return this.workflow.state_by_id(this.state_id);
        } else {
            return null;
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
    public get recommendation(): WorkflowState {
        if (this.recommendation_id && this.workflow && this.workflow.id) {
            const state = this.workflow.state_by_id(this.recommendation_id);
            return state;
        } else {
            return null;
        }
    }

    /**
     * returns the value of 'config.motions_recommendations_by'
     */
    public get recomBy(): string {
        const motionsRecommendationsByConfig = this.DS.filter<Config>(
            Config,
            config => config.key === 'motions_recommendations_by'
        )[0] as Config;

        if (motionsRecommendationsByConfig) {
            const recomByString: string = motionsRecommendationsByConfig.value as string;
            return recomByString;
        } else {
            return '';
        }
    }

    public deserialize(input: any): void {
        Object.assign(this, input);

        if (input.submitters instanceof Array) {
            this.submitters = [];
            input.submitters.forEach(SubmitterData => {
                this.submitters.push(new MotionSubmitter(SubmitterData));
            });
        }

        if (input.log_messages instanceof Array) {
            this.log_messages = [];
            input.log_messages.forEach(logData => {
                this.log_messages.push(new MotionLog(logData));
            });
        }
    }
}

BaseModel.registerCollectionElement('motions/motion', Motion);
