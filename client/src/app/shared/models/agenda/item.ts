import { BaseModelWithContentObject } from '../base/base-model-with-content-object';
import { ContentObject } from '../base/content-object';

/**
 * Determine visibility states for agenda items
 * Coming from "ConfigVariables" property "agenda_hide_internal_items_on_projector"
 */
export const ItemVisibilityChoices = [
    { key: 1, name: 'public', csvName: '' },
    { key: 2, name: 'internal', csvName: 'internal' },
    { key: 3, name: 'hidden', csvName: 'hidden' }
];

/**
 * Representations of agenda Item
 * @ignore
 */
export class Item extends BaseModelWithContentObject<Item> {
    public static COLLECTIONSTRING = 'agenda/item';

    // TODO: remove this, if the server can properly include the agenda item number
    // in the title information. See issue #4738
    private _itemNumber: string;
    private _titleInformation: any;

    public id: number;
    public get item_number(): string {
        return this._itemNumber;
    }
    public set item_number(val: string) {
        this._itemNumber = val;
        if (this._titleInformation) {
            this._titleInformation.agenda_item_number = () => this.item_number;
        }
    }
    public get title_information(): object {
        return this._titleInformation;
    }
    public set title_information(val: object) {
        this._titleInformation = val;
        this._titleInformation.agenda_item_number = () => this.item_number;
    }
    public comment: string;
    public closed: boolean;
    public type: number;
    public is_hidden: boolean;
    public duration: number; // minutes
    public content_object: ContentObject;
    public weight: number;
    public parent_id: number;
    public level: number;
    public tags_id: number[];

    public constructor(input?: any) {
        super(Item.COLLECTIONSTRING, input);
    }
}
