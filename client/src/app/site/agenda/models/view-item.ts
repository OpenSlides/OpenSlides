import { Item, ItemVisibilityChoices } from 'app/shared/models/agenda/item';
import { ContentObject } from 'app/shared/models/base/content-object';
import { BaseViewModelWithAgendaItem } from 'app/site/base/base-view-model-with-agenda-item';
import { BaseViewModelWithContentObject } from 'app/site/base/base-view-model-with-content-object';
import { ViewTag } from 'app/site/tags/models/view-tag';

export interface ItemTitleInformation {
    contentObject: BaseViewModelWithAgendaItem;
    contentObjectData: ContentObject;
    title_information: object;
}

export class ViewItem extends BaseViewModelWithContentObject<Item, BaseViewModelWithAgendaItem>
    implements ItemTitleInformation {
    public static COLLECTIONSTRING = Item.COLLECTIONSTRING;
    protected _collectionString = Item.COLLECTIONSTRING;

    public get item(): Item {
        return this._model;
    }

    public getSubtitle: () => string | null;

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
     * Returns the collection of the underlying content-object.
     *
     * @returns The collection as string.
     */
    public get collection(): string {
        return this.contentObjectData.collection;
    }
}
interface IItemRelations {
    tags: ViewTag[];
}
export interface ViewItem extends Item, IItemRelations {}
