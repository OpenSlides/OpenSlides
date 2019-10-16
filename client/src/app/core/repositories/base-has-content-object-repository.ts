import { BaseModelWithContentObject } from 'app/shared/models/base/base-model-with-content-object';
import { ContentObject } from 'app/shared/models/base/content-object';
import { BaseViewModel, TitleInformation } from 'app/site/base/base-view-model';
import { BaseViewModelWithContentObject } from 'app/site/base/base-view-model-with-content-object';
import { BaseRepository } from './base-repository';

/**
 * A base repository for objects that *have* content objects, e.g. items and lists of speakers.
 * Ensures that these objects must have a content objects via generics and adds a way of
 * efficient querying objects by their content objects:
 * If one wants to have the object for "motions/motion:1", call `findByContentObject` with
 * these information represented as a {@link ContentObject}.
 */
export abstract class BaseHasContentObjectRepository<
    V extends BaseViewModelWithContentObject<M, C> & T,
    M extends BaseModelWithContentObject,
    C extends BaseViewModel,
    T extends TitleInformation
> extends BaseRepository<V, M, T> {
    protected contentObjectMapping: {
        [collection: string]: {
            [id: number]: V;
        };
    } = {};

    /**
     * Returns the object with has the given content object as the content object.
     *
     * @param contentObject The content object to query.
     */
    public findByContentObject(contentObject: ContentObject): V | null {
        if (
            this.contentObjectMapping[contentObject.collection] &&
            this.contentObjectMapping[contentObject.collection][contentObject.id]
        ) {
            return this.contentObjectMapping[contentObject.collection][contentObject.id];
        }
    }

    /**
     * @override
     */
    public changedModels(ids: number[]): void {
        ids.forEach(id => {
            const v = this.createViewModelWithTitles(this.DS.get(this.collectionString, id));
            this.viewModelStore[id] = v;

            const contentObject = v.contentObjectData;
            if (!this.contentObjectMapping[contentObject.collection]) {
                this.contentObjectMapping[contentObject.collection] = {};
            }
            this.contentObjectMapping[contentObject.collection][contentObject.id] = v;
            this.updateViewModelObservable(id);
        });
    }

    /**
     * @override
     */
    public deleteModels(ids: number[]): void {
        ids.forEach(id => {
            const v = this.viewModelStore[id];
            if (v) {
                const contentObject = v.contentObjectData;
                if (this.contentObjectMapping[contentObject.collection]) {
                    delete this.contentObjectMapping[contentObject.collection][contentObject.id];
                }
            }
            delete this.viewModelStore[id];
            this.updateViewModelObservable(id);
        });
    }
}
