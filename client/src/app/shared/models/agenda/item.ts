import { Speaker } from './speaker';
import { BaseModel } from '../base/base-model';

/**
 * The representation of the content object for agenda items. The unique combination
 * of the collection and id is given.
 */
interface ContentObject {
    id: number;
    collection: string;
}

/**
 * Determine visibility states for agenda items
 * Coming from "ConfigVariables" property "agenda_hide_internal_items_on_projector"
 */
export const itemVisibilityChoices = [
    { key: 1, name: 'Public item', csvName: '' },
    { key: 2, name: 'Internal item', csvName: 'internal' },
    { key: 3, name: 'Hidden item', csvName: 'hidden' }
];

/**
 * Representations of agenda Item
 * @ignore
 */
export class Item extends BaseModel<Item> {
    public static COLLECTIONSTRING = 'agenda/item';

    public id: number;
    public item_number: string;
    public title_information: object;
    public comment: string;
    public closed: boolean;
    public type: number;
    public is_hidden: boolean;
    public duration: number; // minutes
    public speakers: Speaker[];
    public speaker_list_closed: boolean;
    public content_object: ContentObject;
    public weight: number;
    public parent_id: number;

    public constructor(input?: any) {
        super(Item.COLLECTIONSTRING, input);
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
