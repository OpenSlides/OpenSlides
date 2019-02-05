import { Speaker, SpeakerState } from './speaker';
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
 * Coming from "OpenSlidesConfigVariables" property "agenda_hide_internal_items_on_projector"
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
    public id: number;
    public item_number: string;
    public title: string;
    public title_with_type: string;
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
        super('agenda/item', 'Item', input);
    }

    public deserialize(input: any): void {
        Object.assign(this, input);

        if (input.speakers instanceof Array) {
            this.speakers = input.speakers.map(speakerData => {
                return new Speaker(speakerData);
            });
        }
    }

    /**
     * Gets the amount of waiting speakers
     */
    public get waitingSpeakerAmount(): number {
        return this.speakers.filter(speaker => speaker.state === SpeakerState.WAITING).length;
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
