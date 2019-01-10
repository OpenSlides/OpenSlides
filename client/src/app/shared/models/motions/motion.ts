import { MotionSubmitter } from './motion-submitter';
import { MotionLog } from './motion-log';
import { MotionComment } from './motion-comment';
import { AgendaBaseModel } from '../base/agenda-base-model';
import { SearchRepresentation } from '../../../core/services/search.service';

/**
 * Representation of Motion.
 *
 * Slightly Defined cause heavy maintaince on server side.
 *
 * @ignore
 */
export class Motion extends AgendaBaseModel {
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
    public statute_paragraph_id: number;
    public recommendation_id: number;
    public recommendation_extension: string;
    public tags_id: number[];
    public attachments_id: number[];
    public polls: Object[];
    public agenda_item_id: number;
    public log_messages: MotionLog[];
    public weight: number;
    public sort_parent_id: number;

    public constructor(input?: any) {
        super('motions/motion', 'Motion', input);
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

    public getTitle(): string {
        if (this.identifier) {
            return this.identifier + ': ' + this.title;
        }
    }

    public getAgendaTitle(): string {
        // if the identifier is set, the title will be 'Motion <identifier>'.
        if (this.identifier) {
            return 'Motion ' + this.identifier;
        } else {
            return this.getTitle();
        }
    }

    public getAgendaTitleWithType(): string {
        // Append the verbose name only, if not the special format 'Motion <identifier>' is used.
        if (this.identifier) {
            return 'Motion ' + this.identifier;
        } else {
            return this.getTitle() + ' (' + this.getVerboseName() + ')';
        }
    }

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        let searchValues = [this.title, this.text, this.reason];
        if (this.amendment_paragraphs) {
            searchValues = searchValues.concat(this.amendment_paragraphs.filter(x => !!x));
        }
        return searchValues;
    }

    public getDetailStateURL(): string {
        return `/motions/${this.id}`;
    }

    public deserialize(input: any): void {
        Object.assign(this, input);

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
