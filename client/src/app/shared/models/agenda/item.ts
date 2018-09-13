import { BaseModel } from '../base.model';
import { Speaker } from './speaker';

interface ContentObject {
    id: number;
    collection: string;
}

/**
 * Representations of agenda Item
 * @ignore
 */
export class Item extends BaseModel {
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

    public constructor(input?: any) {
        super('agenda/item', input);
    }

    public deserialize(input: any): void {
        Object.assign(this, input);

        if (input.speakers instanceof Array) {
            this.speakers = input.speakers.map(speakerData => {
                return new Speaker(speakerData);
            });
        }
    }

    public toString(): string {
        return this.title;
    }
}

BaseModel.registerCollectionElement('agenda/item', Item);
