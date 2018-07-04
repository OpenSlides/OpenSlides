import { BaseModel } from 'app/core/models/baseModel';

export class Assignment extends BaseModel {
    static collectionString = 'assignments/assignment';
    id: number;
    agenda_item_id: number;
    description: string;
    open_posts: number;
    phase: number;
    poll_description_default: number;
    polls: Object[];
    tags_id: number[];
    title: string;

    constructor(
        id: number,
        agenda_item_id?: number,
        description?: string,
        open_posts?: number,
        phase?: number,
        poll_description_default?: number,
        polls?: Object[],
        tags_id?: number[],
        title?: string
    ) {
        super(id);
        this.id = id;
        this.agenda_item_id = agenda_item_id;
        this.description = description;
        this.open_posts = open_posts;
        this.phase = phase;
        this.poll_description_default = poll_description_default;
        this.polls = polls;
        this.tags_id = tags_id;
        this.title = title;
    }

    public getCollectionString(): string {
        return Assignment.collectionString;
    }
}
