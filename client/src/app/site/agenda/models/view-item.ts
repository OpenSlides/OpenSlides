import { BaseViewModel } from '../../base/base-view-model';
import { Item } from '../../../shared/models/agenda/item';
import { AgendaBaseModel } from '../../../shared/models/base/agenda-base-model';
import { Speaker } from 'app/shared/models/agenda/speaker';

export class ViewItem extends BaseViewModel {
    private _item: Item;
    private _contentObject: AgendaBaseModel;

    /**
     * virtual weight defined by the order in the agenda tree, representing a shortcut to sorting by
     * weight, parent_id and the parents' weight(s)
     * TODO will be accurate if the viewMotion is observed via {@link getViewModelListObservable}, else, it will be undefined
     */
    public agendaListWeight: number;

    /**
     * The amount of parents in the agenda list tree.
     * TODO will be accurate if the viewMotion is observed via {@link getViewModelListObservable}, else, it will be undefined
     */
    public agendaListLevel: number;

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

    public get waitingSpeakerAmount(): number {
        return this.item ? this.item.waitingSpeakerAmount : null;
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

    public get verboseType(): string {
        if (this.item && this.item.verboseType) {
            return this.item.verboseType;
        }
        return '';
    }

    public get verboseCsvType(): string {
        return this.item ? this.item.verboseCsvType : '';
    }

    /**
     * TODO: make the repository set the ViewSpeakers here.
     */
    public get speakers(): Speaker[] {
        return this.item ? this.item.speakers : [];
    }

    /**
     * @returns the weight the server assigns to that item. Mostly useful for sorting within
     * it's own hierarchy level (items sharing a parent)
     */
    public get weight(): number {
        return this.item ? this.item.weight : null;
    }

    /**
     * @returns the parent's id of that item (0 if no parent is set).
     */
    public get parent_id(): number {
        return this.item ? this.item.parent_id : null;
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
