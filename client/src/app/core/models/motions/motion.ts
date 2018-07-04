import { BaseModel } from 'app/core/models/baseModel';

export class Motion extends BaseModel {
    static collectionString = 'motions/motion';
    id: number;
    active_version: number;
    agenda_item_id: number;
    attachments_id: number[];
    category_id: number;
    comments: Object;
    identifier: string;
    log_messages: Object[];
    motion_block_id: number;
    origin: string;
    parent_id: number;
    polls: BaseModel[];
    recommendation_id: number;
    state_id: number;
    state_required_permission_to_see: string;
    submitters: Object[];
    supporters_id: number[];
    tags_id: number[];
    versions: Object[];

    constructor(
        id: number,
        active_version?: number,
        agenda_item_id?: number,
        attachments_id?: number[],
        category_id?: number,
        comments?: Object,
        identifier?: string,
        log_messages?: Object[],
        motion_block_id?: number,
        origin?: string,
        parent_id?: number,
        polls?: BaseModel[],
        recommendation_id?: number,
        state_id?: number,
        state_required_permission_to_see?: string,
        submitters?: Object[],
        supporters_id?: number[],
        tags_id?: number[],
        versions?: Object[]
    ) {
        super(id);
        this.active_version = active_version;
        this.agenda_item_id = agenda_item_id;
        this.attachments_id = attachments_id;
        this.category_id = category_id;
        this.comments = comments;
        this.identifier = identifier;
        this.log_messages = log_messages;
        this.motion_block_id = motion_block_id;
        this.origin = origin;
        this.parent_id = parent_id;
        this.polls = polls;
        this.recommendation_id = recommendation_id;
        this.state_id = state_id;
        this.state_required_permission_to_see = state_required_permission_to_see;
        this.submitters = submitters;
        this.supporters_id = supporters_id;
        this.tags_id = tags_id;
        this.versions = versions;
    }

    public getCollectionString(): string {
        return Motion.collectionString;
    }
}
