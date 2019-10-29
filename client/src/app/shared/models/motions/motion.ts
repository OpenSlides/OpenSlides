import { BaseModelWithAgendaItemAndListOfSpeakers } from '../base/base-model-with-agenda-item-and-list-of-speakers';
import { Submitter } from './submitter';

export interface MotionComment {
    id: number;
    comment: string;
    section_id: number;
    read_groups_id: number[];
}

export interface MotionWithoutNestedModels extends BaseModelWithAgendaItemAndListOfSpeakers<Motion> {
    id: number;
    identifier: string;
    title: string;
    text: string;
    reason: string;
    amendment_paragraphs: string[] | null;
    modified_final_version: string;
    parent_id: number;
    category_id: number;
    category_weight: number;
    motion_block_id: number;
    origin: string;
    supporters_id: number[];
    comments: MotionComment[];
    workflow_id: number;
    state_id: number;
    state_extension: string;
    state_required_permission_to_see: string;
    statute_paragraph_id: number;
    recommendation_id: number;
    recommendation_extension: string;
    tags_id: number[];
    attachments_id: number[];
    weight: number;
    sort_parent_id: number;
    created: string;
    last_modified: string;
    change_recommendations_id: number[];

    sorted_submitter_ids: number[];
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
    public submitters: Submitter[];

    public constructor(input?: any) {
        super(Motion.COLLECTIONSTRING, input);
    }

    /**
     * returns the motion submitters user ids
     */
    public get sorted_submitter_ids(): number[] {
        return this.submitters
            .sort((a: Submitter, b: Submitter) => {
                return a.weight - b.weight;
            })
            .map((submitter: Submitter) => submitter.user_id);
    }
}

export interface Motion extends MotionWithoutNestedModels {}
