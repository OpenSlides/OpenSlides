import { ProjectableBaseModel } from '../base/projectable-base-model';
import { Speaker } from './speaker';

/**
 * The representation of the content object for agenda items. The unique combination
 * of the collection and id is given.
 */
interface ContentObject {
    id: number;
    collection: string;
}

/**
 * Representations of agenda Item
 * @ignore
 */
export class Item extends ProjectableBaseModel {
    public id: number;
    public item_number: string;
    public title: string;
    public title_with_type: string;
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

    public getTitle(): string {
        return this.title;
    }

    public getListTitle(): string {
        return this.title_with_type;
    }

    public getProjectorTitle(): string {
        return this.getListTitle();
    }
}
