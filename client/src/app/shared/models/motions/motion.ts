import { BaseModel } from '../base.model';
import { MotionSubmitter } from './motion-submitter';
import { MotionLog } from './motion-log';
import { Category } from './category';
import { MotionComment } from './motion-comment';
import { Workflow } from './workflow';

/**
 * Representation of Motion.
 *
 * Slightly Defined cause heavy maintaince on server side.
 *
 * @ignore
 */
export class Motion extends BaseModel {
    public id: number;
    public identifier: string;
    public title: string;
    public text: string;
    public reason: string;
    public amendment_paragraphs: string[];
    public modified_final_version: string;
    public parent_id: number;
    public category_id: number;
    public motion_block_id: number;
    public origin: string;
    public submitters: MotionSubmitter[];
    public supporters_id: number[];
    public comments: MotionComment[];
    public workflow_id: number;
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

    public constructor(input?: any) {
        super('motions/motion', input);
    }

    /**
     * update the values of the motion with new values
     */
    public patchValues(update: object): void {
        Object.assign(this, update);
    }

    /**
     * returns the motion submitters userIDs
     */
    public get submitterIds(): number[] {
        return this.submitters
            .sort((a: MotionSubmitter, b: MotionSubmitter) => {
                return a.weight - b.weight;
            })
            .map((submitter: MotionSubmitter) => submitter.user_id);
    }

    public deserialize(input: any): void {
        Object.assign(this, input);

        if (input.submitters instanceof Array) {
            input.submitters.forEach(SubmitterData => {
                this.submitters.push(new MotionSubmitter(SubmitterData));
            });
        }

        this.log_messages = [];
        if (input.log_messages instanceof Array) {
            input.log_messages.forEach(logData => {
                this.log_messages.push(new MotionLog(logData));
            });
        }

        this.comments = [];
        if (input.comments instanceof Array) {
            input.comments.forEach(commentData => {
                this.comments.push(new MotionComment(commentData));
            });
        }
    }
}

/**
 * Hack to get them loaded at last
 */
BaseModel.registerCollectionElement('motions/motion', Motion);
BaseModel.registerCollectionElement('motions/category', Category);
BaseModel.registerCollectionElement('motions/workflow', Workflow);
