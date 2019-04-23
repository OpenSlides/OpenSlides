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
     * @param isC A function ensuring that an arbitrary object is a valid content object
     * @param CVerbose is the verbose name of the base content object class, for debugging purposes
     * @param contentObject (optional) The content object, if it is known during creation.
     */
    public constructor(
        collectionString: string,
        model: M,
        private isC: (obj: any) => obj is C,
        private CVerbose: string,
        contentObject?: C
    ) {
        super(collectionString, model);
        this._contentObject = contentObject;
    }

    /**
     * Check, if the given model mathces the content object definition. If so, the function
     * returns true, else false.
     */
    public updateDependencies(update: BaseViewModel): boolean {
        if (
            update &&
            update.collectionString === this.contentObjectData.collection &&
            update.id === this.contentObjectData.id
        ) {
            if (this.isC(update)) {
                this._contentObject = update;
                return true;
            } else {
                throw new Error(`The object is not an ${this.CVerbose}:` + update);
            }
        }
        return false;
    }
}
