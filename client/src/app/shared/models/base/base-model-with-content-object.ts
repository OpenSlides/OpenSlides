import { ContentObject } from './content-object';
import { BaseModel } from './base-model';

/**
 * A base model which has a content object, like items of list of speakers.
 */
export abstract class BaseModelWithContentObject<T = object> extends BaseModel<T> {
    public abstract content_object: ContentObject;
}
