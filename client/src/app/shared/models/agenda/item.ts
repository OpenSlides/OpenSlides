import { BaseModel } from '../base.model';
import { Speaker } from './speaker';
import { User } from '../users/user';

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
    private content_object: ContentObject;
    public weight: number;
    public parent_id: number;

    public constructor(input?: any) {
        super('agenda/item', input);
    }

    public getSpeakers(): User[] {
        const speakerIds: number[] = this.speakers
            .sort((a: Speaker, b: Speaker) => {
                return a.weight - b.weight;
            })
            .map((speaker: Speaker) => speaker.user_id);
        return this.DS.getMany<User>('users/user', speakerIds);
    }

    public get contentObject(): BaseModel {
        return this.DS.get<BaseModel>(this.content_object.collection, this.content_object.id);
    }

    public deserialize(input: any): void {
        Object.assign(this, input);

        if (input.speakers instanceof Array) {
            this.speakers = input.speakers.map(speakerData => {
                return new Speaker(speakerData);
            });
        }
    }
}

BaseModel.registerCollectionElement('agenda/item', Item);
