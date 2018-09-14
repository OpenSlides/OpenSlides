import { ProjectableBaseModel } from '../base/projectable-base-model';
import { Speaker } from './speaker';

/**
 * The representation of the content object for agenda items. The unique combination
 * of the collection and id is given.
 */
interface ContentObject {
    id: number;
    collection: string;
}

/**
 * Representations of agenda Item
 * @ignore
 */
export class Item extends ProjectableBaseModel {
    public id: number;
    public item_number: string;
    public title: string;
    public title_with_type: string;
    public comment: string;
    public closed: boolean;
    public type: number;
    public is_hidden: boolean;
    public duration: number;
    public speakers: Speaker[];
    public speaker_list_closed: boolean;
    public content_object: ContentObject;
    public weight: number;
    public parent_id: number;

    public constructor(input?: any) {
        super('agenda/item', input);
    }

    // Note: This has to be used in the agenda repository
    /*public get contentObject(): AgendaBaseModel {
        const contentObject = this.DS.get<BaseModel>(this.content_object.collection, this.content_object.id);
        if (!contentObject) {
            return null;
        }
        if (contentObject instanceof AgendaBaseModel) {
            return contentObject as AgendaBaseModel;
        } else {
            throw new Error(
                `The content object (${this.content_object.collection}, ${this.content_object.id}) of item ${
                    this.id
                } is not a BaseProjectableModel.`
            );
        }
    }*/

    public deserialize(input: any): void {
        Object.assign(this, input);

        if (input.speakers instanceof Array) {
            this.speakers = input.speakers.map(speakerData => {
                return new Speaker(speakerData);
            });
        }
    }

    // The repository has to check for the content object and choose which title to use.
    // The code below is belongs to the repository
    public getTitle(): string {
        /*const contentObject: AgendaBaseModel = this.contentObject;
        if (contentObject) {
            return contentObject.getAgendaTitle();
        } else {
            return this.title;
        }*/
        return this.title;
    }

    // Same here. See comment for getTitle()
    public getListTitle(): string {
        /*const contentObject: AgendaBaseModel = this.contentObject;
        if (contentObject) {
            return contentObject.getAgendaTitleWithType();
        } else {
            return this.title_with_type;
        }*/
        return this.title_with_type;
    }

    public getProjectorTitle(): string {
        return this.getListTitle();
    }
}

ProjectableBaseModel.registerCollectionElement('agenda/item', Item);
