import { BaseModel } from '../base.model';
import { Speaker } from './speaker';
import { ContentObject } from './content-object';

/**
 * Representations of agenda Item
 * @ignore
 */
export class Item extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public item_number: string;
    public title: string;
    public list_view_title: string;
    public comment: string;
    public closed: boolean;
    public type: number;
    public is_hidden: boolean;
    public duration: number;
    public speakers: Speaker[];
    public speaker_list_closed: boolean;
    public content_object: ContentObject;
    public weight: number;
    public parent_id: number;

    public constructor(
        id?: number,
        item_number?: string,
        title?: string,
        list_view_title?: string,
        comment?: string,
        closed?: boolean,
        type?: number,
        is_hidden?: boolean,
        duration?: number,
        speakers?: Speaker[],
        speaker_list_closed?: boolean,
        content_object?: ContentObject,
        weight?: number,
        parent_id?: number
    ) {
        super();
        this._collectionString = 'agenda/item';
        this.id = id;
        this.item_number = item_number;
        this.title = title;
        this.list_view_title = list_view_title;
        this.comment = comment;
        this.closed = closed;
        this.type = type;
        this.is_hidden = is_hidden;
        this.duration = duration;
        this.speakers = speakers;
        this.speaker_list_closed = speaker_list_closed;
        this.content_object = content_object;
        this.weight = weight;
        this.parent_id = parent_id;
    }

    public getSpeakersAsUser(): BaseModel | BaseModel[] {
        const speakerIds = [];
        this.speakers.forEach(speaker => {
            speakerIds.push(speaker.user_id);
        });
        return this.DS.get('users/user', ...speakerIds);
    }

    public getContentObject(): BaseModel | BaseModel[] {
        return this.DS.get(this.content_object.collection, this.content_object.id);
    }

    public deserialize(input: any): this {
        Object.assign(this, input);
        this.content_object = new ContentObject().deserialize(input.content_object);

        if (input.speakers instanceof Array) {
            this.speakers = [];
            input.speakers.forEach(speakerData => {
                this.speakers.push(new Speaker().deserialize(speakerData));
            });
        }
        return this;
    }
}

BaseModel.registerCollectionElement('agenda/item', Item);
