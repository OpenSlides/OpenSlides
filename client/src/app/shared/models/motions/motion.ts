import { MotionSubmitter } from './motion-submitter';
import { MotionPoll } from './motion-poll';
import { BaseModelWithAgendaItemAndListOfSpeakers } from '../base/base-model-with-agenda-item-and-list-of-speakers';

export interface MotionComment {
    id: number;
    comment: string;
    section_id: number;
    read_groups_id: number[];
}

/**
 * Representation of Motion.
 *
 * Slightly defined cause heavy maintenance on server side.
 *
 * @ignore
 */
export class Motion extends BaseModelWithAgendaItemAndListOfSpeakers<Motion> {
    public static COLLECTIONSTRING = 'motions/motion';

    public id: number;
    public identifier: string;
    public title: string;
    public text: string;
    public reason: string;
    public amendment_paragraphs: string[];
    public modified_final_version: string;
    public parent_id: number;
    public category_id: number;
    public category_weight: number;
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
    public polls: MotionPoll[];
    public weight: number;
    public sort_parent_id: number;
    public created: string;
    public last_modified: string;

    public constructor(input?: any) {
        super(Motion.COLLECTIONSTRING, input);
    }

    /**
     * returns the motion submitters user ids
     */
    public get sorted_submitters_id(): number[] {
        return this.submitters
            .sort((a: MotionSubmitter, b: MotionSubmitter) => {
                return a.weight - b.weight;
            })
            .map((submitter: MotionSubmitter) => submitter.user_id);
    }
}
