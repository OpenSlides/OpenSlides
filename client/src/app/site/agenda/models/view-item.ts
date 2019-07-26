import { Item, ItemVisibilityChoices } from 'app/shared/models/agenda/item';
import { ContentObject } from 'app/shared/models/base/content-object';
import { BaseViewModelWithAgendaItem } from 'app/site/base/base-view-model-with-agenda-item';
import { BaseViewModelWithContentObject } from 'app/site/base/base-view-model-with-content-object';

export interface ItemTitleInformation {
    contentObject: BaseViewModelWithAgendaItem;
    contentObjectData: ContentObject;
    title_information: object;
}

export class ViewItem extends BaseViewModelWithContentObject<Item, BaseViewModelWithAgendaItem>
    implements ItemTitleInformation {
    public static COLLECTIONSTRING = Item.COLLECTIONSTRING;

    public get item(): Item {
        return this._model;
    }

    public get itemNumber(): string {
        return this.item.item_number;
    }

    public get title_information(): object {
        return this.item.title_information;
    }

    public get duration(): number {
        return this.item.duration;
    }

    public get type(): number {
        return this.item.type;
    }

    public get closed(): boolean {
        return this.item.closed;
    }

    public get comment(): string {
        return this.item.comment;
    }

    public get level(): number {
        return this.item.level;
    }

    /**
     * Gets the string representation of the item type
     * @returns The visibility for this item, as defined in {@link itemVisibilityChoices}
     */
    public get verboseType(): string {
        if (!this.type) {
            return '';
        }
        const type = ItemVisibilityChoices.find(choice => choice.key === this.type);
        return type ? type.name : '';
    }

    /**
     * Gets a shortened string for CSV export
     * @returns empty string if it is a public item, 'internal' or 'hidden' otherwise
     */
    public get verboseCsvType(): string {
        if (!this.type) {
            return '';
        }
        const type = ItemVisibilityChoices.find(choice => choice.key === this.type);
        return type ? type.csvName : '';
    }

    /**
     * @returns the weight the server assigns to that item. Mostly useful for sorting within
     * it's own hierarchy level (items sharing a parent)
     */
    public get weight(): number {
        return this.item.weight;
    }

    /**
     * @returns the parent's id of that item (0 if no parent is set).
     */
    public get parent_id(): number {
        return this.item.parent_id;
    }

    public constructor(item: Item) {
        super(Item.COLLECTIONSTRING, item);
    }
}
