import { BaseViewModel } from '../../base/base-view-model';
import { Item } from 'app/shared/models/agenda/item';
import { Speaker } from 'app/shared/models/agenda/speaker';
import { BaseAgendaViewModel, isAgendaBaseModel } from 'app/site/base/base-agenda-view-model';

export class ViewItem extends BaseViewModel {
    public static COLLECTIONSTRING = Item.COLLECTIONSTRING;

    private _item: Item;
    private _contentObject: BaseAgendaViewModel;

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

    public get contentObject(): BaseAgendaViewModel {
        return this._contentObject;
    }

    public get id(): number {
        return this.item.id;
    }

    public get itemNumber(): string {
        return this.item.item_number;
    }

    public get duration(): number {
        return this.item.duration;
    }

    public get waitingSpeakerAmount(): number {
        return this.item.waitingSpeakerAmount;
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

    public get verboseType(): string {
        return this.item.verboseType;
    }

    public get verboseCsvType(): string {
        return this.item.verboseCsvType;
    }

    /**
     * TODO: make the repository set the ViewSpeakers here.
     */
    public get speakers(): Speaker[] {
        return this.item.speakers;
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

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(item: Item, contentObject: BaseAgendaViewModel) {
        super(Item.COLLECTIONSTRING);
        this._item = item;
        this._contentObject = contentObject;
    }

    public getTitle = () => {
        if (this.contentObject) {
            return this.contentObject.getAgendaTitle();
        } else {
            return this.item ? this.item.title : null;
        }
    };

    /**
     * Create the list view title.
     * If a number was given, 'whitespac-dot-whitespace' will be added to the prefix number
     *
     * @returns the agenda list title as string
     */
    public getListTitle = () => {
        const numberPrefix = this.itemNumber ? `${this.itemNumber} · ` : '';

        if (this.contentObject) {
            return numberPrefix + this.contentObject.getAgendaTitleWithType();
        } else {
            return numberPrefix + this.item.title_with_type;
        }
    };

    public updateDependencies(update: BaseViewModel): boolean {
        if (
            update &&
            update.collectionString === this.item.content_object.collection &&
            update.id === this.item.content_object.id
        ) {
            if (!isAgendaBaseModel(update)) {
                throw new Error('The item is not an BaseAgendaViewModel:' + update);
            }
            this._contentObject = update as BaseAgendaViewModel;
            return true;
        }
        return false;
    }
}
