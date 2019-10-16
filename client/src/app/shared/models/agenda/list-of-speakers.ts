import { BaseModelWithContentObject } from '../base/base-model-with-content-object';
import { ContentObject } from '../base/content-object';
import { Speaker } from './speaker';

export interface ListOfSpeakersWithoutNestedModels extends BaseModelWithContentObject<ListOfSpeakers> {
    id: number;
    title_information: object;
    closed: boolean;
}

/**
 * Representations of agenda Item
 * @ignore
 */
export class ListOfSpeakers extends BaseModelWithContentObject<ListOfSpeakers> {
    public static COLLECTIONSTRING = 'agenda/list-of-speakers';

    public id: number;
    public title_information: object;
    public speakers: Speaker[];
    public closed: boolean;
    public content_object: ContentObject;

    public constructor(input?: any) {
        super(ListOfSpeakers.COLLECTIONSTRING, input);
    }
}

export interface ListOfSpeakers extends ListOfSpeakersWithoutNestedModels {}
