import { BaseModel } from 'app/core/models/baseModel';

export class Item extends BaseModel {
    static collectionString = 'agenda/item';
    id: number;
    closed: boolean;
    comment: string;
    content_object: Object;
    duration: number; //time?
    is_hidden: boolean;
    item_number: string;
    list_view_title: string;
    parent_id: number;
    speaker_list_closed: boolean;
    speakers: BaseModel[]; //we should not know users just yet
    title: string;
    type: number;
    weight: number;

    constructor(
        id: number,
        closed?: boolean,
        comment?: string,
        content_object?: Object,
        duration?: number,
        is_hidden?: boolean,
        item_number?: string,
        list_view_title?: string,
        parent_id?: number,
        speaker_list_closed?: boolean,
        speakers?: BaseModel[],
        title?: string,
        type?: number,
        weight?: number
    ) {
        super(id);
        this.comment = comment;
        this.content_object = content_object;
        this.duration = duration;
        this.is_hidden = is_hidden;
        this.item_number = item_number;
        this.list_view_title = list_view_title;
        this.parent_id = parent_id;
        this.speaker_list_closed = speaker_list_closed;
        this.speakers = speakers;
        this.title = title;
        this.type = type;
        this.weight = weight;
    }

    public getCollectionString(): string {
        return Item.collectionString;
    }
}
