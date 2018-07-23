import { BaseModel } from '../base.model';

/**
 * Representation of Motion.
 *
 * Untouched for now because of heavy maintainance  on server side
 *
 * @ignore
 */
export class Motion extends BaseModel {
    protected _collectionString: string;
    id: number;
    identifier: string;
    versions: Object[];
    active_version: number;
    parent_id: number;
    category_id: number;
    motion_block_id: number;
    origin: string;
    submitters: Object[];
    supporters_id: number[];
    comments: Object;
    state_id: number;
    state_required_permission_to_see: string;
    recommendation_id: number;
    tags_id: number[];
    attachments_id: number[];
    polls: BaseModel[];
    agenda_item_id: number;
    log_messages: Object[];

    constructor(
        id?: number,
        identifier?: string,
        versions?: Object[],
        active_version?: number,
        parent_id?: number,
        category_id?: number,
        motion_block_id?: number,
        origin?: string,
        submitters?: Object[],
        supporters_id?: number[],
        comments?: Object,
        state_id?: number,
        state_required_permission_to_see?: string,
        recommendation_id?: number,
        tags_id?: number[],
        attachments_id?: number[],
        polls?: BaseModel[],
        agenda_item_id?: number,
        log_messages?: Object[]
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
    }
}
