import { BaseViewModel } from '../../base/base-view-model';
import { Item } from '../../../shared/models/agenda/item';
import { AgendaBaseModel } from '../../../shared/models/base/agenda-base-model';

export class ViewItem extends BaseViewModel {
    private _item: Item;
    private _contentObject: AgendaBaseModel;

    public get item(): Item {
        return this._item;
    }

    public get contentObject(): AgendaBaseModel {
        return this._contentObject;
    }

    public get id(): number {
        return this.item ? this.item.id : null;
    }

    public get itemNumber(): string {
        return this.item ? this.item.item_number : null;
    }

    public get duration(): number {
        return this.item ? this.item.duration : null;
    }

    public get speakerAmount(): number {
        return this.item ? this.item.speakerAmount : null;
    }

    public get type(): number {
        return this.item ? this.item.type : null;
    }

    public get closed(): boolean {
        return this.item ? this.item.closed : null;
    }
    public get comment(): string {
        if (this.item && this.item.comment) {
            return this.item.comment;
        }
        return '';
    }

    public get verboseType() : string {
        if (this.item && this.item.verboseType) {
            return this.item.verboseType;
        }
        return '';
    }

    public constructor(item: Item, contentObject: AgendaBaseModel) {
        super();
        this._item = item;
        this._contentObject = contentObject;
    }

    public getTitle(): string {
        if (this.contentObject) {
            return this.contentObject.getAgendaTitle();
        } else {
            return this.item ? this.item.title : null;
        }
    }

    /**
     * Create the list view title.
     * If a number was given, 'whitespac-dot-whitespace' will be added to the prefix number
     *
     * @returns the agenda list title as string
     */
    public getListTitle(): string {
        const contentObject: AgendaBaseModel = this.contentObject;
        const numberPrefix = this.itemNumber ? `${this.itemNumber} · ` : '';

        if (contentObject) {
            return numberPrefix + contentObject.getAgendaTitleWithType();
        } else {
            return this.item ? numberPrefix + this.item.title_with_type : null;
        }
    }

    public updateValues(update: Item): void {
        if (this.id === update.id) {
            this._item = update;
        }
    }
}
