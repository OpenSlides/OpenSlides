import { BaseViewModel } from './base-view-model';
import { BaseModelWithContentObject } from 'app/shared/models/base/base-model-with-content-object';
import { ContentObject } from 'app/shared/models/base/content-object';

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
    protected _contentObject?: C;

    public get contentObjectData(): ContentObject {
        return this.getModel().content_object;
    }

    public get contentObject(): C | null {
        return this._contentObject;
    }

    /**
     * @param collectionString The collection string of this model
     * @param model the model this view model captures
     */
    public constructor(collectionString: string, model: M) {
        super(collectionString, model);
    }
}
