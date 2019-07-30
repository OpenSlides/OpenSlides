import { BaseRepository, RelationDefinition } from './base-repository';
import { BaseModelWithContentObject } from 'app/shared/models/base/base-model-with-content-object';
import { BaseViewModelWithContentObject } from 'app/site/base/base-view-model-with-content-object';
import { ContentObject } from 'app/shared/models/base/content-object';
import { BaseViewModel, TitleInformation, ViewModelConstructor } from 'app/site/base/base-view-model';
import { DataStoreService } from '../core-services/data-store.service';
import { DataSendService } from '../core-services/data-send.service';
import { CollectionStringMapperService } from '../core-services/collection-string-mapper.service';
import { ViewModelStoreService } from '../core-services/view-model-store.service';
import { TranslateService } from '@ngx-translate/core';
import { ModelConstructor } from 'app/shared/models/base/base-model';

/**
 * A generic relation for models with a content_object
 */
export interface GenericRelationDefinition<VForeign extends BaseViewModel = BaseViewModel> {
    type: 'generic';
    possibleModels: ViewModelConstructor<BaseViewModel>[];
    isVForeign: (obj: any) => obj is VForeign;
    VForeignVerbose: string;
}

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

    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        collectionStringMapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        baseModelCtor: ModelConstructor<M>,
        relationDefinitions: (RelationDefinition | GenericRelationDefinition)[] = []
    ) {
        super(DS, dataSend, collectionStringMapperService, viewModelStoreService, translate, baseModelCtor, <
            RelationDefinition[]
        >relationDefinitions); // This cast "hides" the new generic relation from the base repository. Typescript can't handle this...
    }

    protected _groupRelationsByCollections(
        relation: RelationDefinition | GenericRelationDefinition,
        baseRelation: RelationDefinition
    ): void {
        if (relation.type === 'generic') {
            relation.possibleModels.forEach(ctor => {
                const collection = ctor.COLLECTIONSTRING;
                if (!this.relationsByCollection[collection]) {
                    this.relationsByCollection[collection] = [];
                }
                // The cast to any is needed to convince Typescript, that a GenericRelationDefinition can also
                // be used as a RelationDefinition
                this.relationsByCollection[collection].push(<any>baseRelation);
            });
        } else {
            super._groupRelationsByCollections(relation, baseRelation);
        }
    }

    /**
     * Adds the generic relation.
     */
    protected updateSingleDependency(
        ownViewModel: V,
        relation: RelationDefinition | GenericRelationDefinition,
        collection: string,
        changedId: number
    ): boolean {
        if (relation.type === 'generic') {
            const foreignModel = <any>this.viewModelStoreService.get(collection, changedId);
            if (
                foreignModel &&
                foreignModel.collectionString === ownViewModel.contentObjectData.collection &&
                foreignModel.id === ownViewModel.contentObjectData.id
            ) {
                if (relation.isVForeign(foreignModel)) {
                    (<any>ownViewModel)._contentObject = foreignModel;
                    return true;
                } else {
                    throw new Error(`The object is not an ${relation.VForeignVerbose}:` + foreignModel);
                }

                // TODO: set reverse
            }
        } else {
            super.updateSingleDependency(ownViewModel, relation, collection, changedId);
        }
    }

    /**
     * Adds the generic relation.
     */
    protected setRelationsInViewModel<K extends BaseViewModel = V>(
        model: M,
        viewModel: K,
        relation: RelationDefinition | GenericRelationDefinition
    ): void {
        if (relation.type === 'generic') {
            (<any>viewModel)._contentObject = this.getContentObject(model, relation);
        } else {
            super.setRelationsInViewModel(model, viewModel, relation);
        }
    }

    /**
     * Tries to get the content object (as a view model) from the given model and relation.
     */
    protected getContentObject(model: M, relation: GenericRelationDefinition): BaseViewModel {
        const contentObject = this.viewModelStoreService.get<BaseViewModel>(
            model.content_object.collection,
            model.content_object.id
        );
        if (!contentObject || !relation.isVForeign(contentObject)) {
            return null;
        }
        return contentObject;
    }

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
