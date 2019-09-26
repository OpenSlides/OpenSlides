import { BaseModel } from './base-model';
import { ContentObject } from './content-object';

/**
 * A base model which has a content object, like items of list of speakers.
 */
export abstract class BaseModelWithContentObject<T = any> extends BaseModel<T> {
    public abstract content_object: ContentObject;

    public get contentObjectData(): ContentObject {
        return this.content_object;
    }
}
