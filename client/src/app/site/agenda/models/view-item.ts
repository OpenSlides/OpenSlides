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

    public get duration(): number {
        return this.item ? this.item.duration : null;
    }

    public get speakerAmount(): number {
        return this.item ? this.item.speakerAmount : null;
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

    public getListTitle(): string {
        const contentObject: AgendaBaseModel = this.contentObject;
        if (contentObject) {
            return contentObject.getAgendaTitleWithType();
        } else {
            return this.item ? this.item.title_with_type : null;
        }
    }

    public updateValues(update: Item): void {
        if (this.id === update.id) {
            this._item = update;
        }
    }
}
