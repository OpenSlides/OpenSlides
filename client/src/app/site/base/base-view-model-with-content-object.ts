import { BaseModelWithContentObject } from 'app/shared/models/base/base-model-with-content-object';
import { ContentObject } from 'app/shared/models/base/content-object';
import { BaseViewModel } from './base-view-model';

/**
 * Base class for view models with content objects. Ensures a content object attribute and
 * implements the generic logic for `updateDependencies`.
 *
 * Type M is the contained model
 * Type C is the type of every content object.
 */
export abstract class BaseViewModelWithContentObject<
    M extends BaseModelWithContentObject = any,
    C extends BaseViewModel = any
> extends BaseViewModel<M> {
    public get contentObjectData(): ContentObject {
        return this.getModel().content_object;
    }
}

export interface BaseViewModelWithContentObject<
    M extends BaseModelWithContentObject = any,
    C extends BaseViewModel = any
> {
    contentObject: C | null;
}
