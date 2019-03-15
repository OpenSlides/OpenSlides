import { BaseViewModel } from '../../base/base-view-model';
import { Item, itemVisibilityChoices } from 'app/shared/models/agenda/item';
import { Speaker, SpeakerState } from 'app/shared/models/agenda/speaker';
import { BaseAgendaViewModel, isAgendaBaseModel } from 'app/site/base/base-agenda-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';

export class ViewItem extends BaseViewModel {
    public static COLLECTIONSTRING = Item.COLLECTIONSTRING;

    private _item: Item;
    private _contentObject: BaseAgendaViewModel;

    /**
     * virtual weight defined by the order in the agenda tree, representing a shortcut to sorting by
     * weight, parent_id and the parents' weight(s)
     * TODO will be accurate if the viewMotion is observed via {@link getSortedViewModelListObservable}, else, it will be undefined
     */
    public agendaListWeight: number;

    /**
     * The amount of parents in the agenda list tree.
     * TODO will be accurate if the viewMotion is observed via {@link getSortedViewModelListObservable}, else, it will be undefined
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

    public get title_information(): object {
        return this.item.title_information;
    }

    public get duration(): number {
        return this.item.duration;
    }

    /**
     * Gets the amount of waiting speakers
     */
    public get waitingSpeakerAmount(): number {
        return this.item.speakers.filter(speaker => speaker.state === SpeakerState.WAITING).length;
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

    /**
     * Gets the string representation of the item type
     * @returns The visibility for this item, as defined in {@link itemVisibilityChoices}
     */
    public get verboseType(): string {
        if (!this.type) {
            return '';
        }
        const type = itemVisibilityChoices.find(choice => choice.key === this.type);
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
        const type = itemVisibilityChoices.find(choice => choice.key === this.type);
        return type ? type.csvName : '';
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
    public getVerboseName: () => string;
    public getTitle: () => string;
    public getListTitle: () => string;

    public listOfSpeakersSlide: ProjectorElementBuildDeskriptor = {
        getBasicProjectorElement: options => ({
            name: 'agenda/list-of-speakers',
            id: this.id,
            getIdentifiers: () => ['name', 'id']
        }),
        slideOptions: [],
        projectionDefaultName: 'agenda_list_of_speakers',
        getDialogTitle: () => this.getTitle()
    };

    public constructor(item: Item, contentObject: BaseAgendaViewModel) {
        super(Item.COLLECTIONSTRING);
        this._item = item;
        this._contentObject = contentObject;
    }

    public getModel(): Item {
        return this.item;
    }

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
