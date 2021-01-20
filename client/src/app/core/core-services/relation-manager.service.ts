import { Injectable } from '@angular/core';

import { BaseModel } from 'app/shared/models/base/base-model';
import { BaseViewModel, ViewModelConstructor } from 'app/site/base/base-view-model';
import { ModelDescriptor, NestedModelDescriptors } from '../repositories/base-repository';
import { CacheChangeIds, RelationCacheService } from './relation-cache.service';
import {
    isCustomRelationDefinition,
    isGenericRelationDefinition,
    isNormalRelationDefinition,
    isReverseRelationDefinition,
    RelationDefinition
} from '../definitions/relations';
import { ViewModelStoreService } from './view-model-store.service';

/**
 * Manages relations between view models. This service is and should only used by the
 * base repository to offload managing relations between view models.
 */
@Injectable({
    providedIn: 'root'
})
export class RelationManagerService {
    public constructor(
        private viewModelStoreService: ViewModelStoreService,
        private relationCacheService: RelationCacheService
    ) {}

    public handleRelation<M extends BaseModel, V extends BaseViewModel>(
        model: M,
        viewModel: V,
        relation: RelationDefinition
    ): any {
        if (isNormalRelationDefinition(relation)) {
            if (
                (relation.type === 'M2M' || relation.type === 'O2M') &&
                model[relation.ownIdKey] &&
                model[relation.ownIdKey].constructor === Array
            ) {
                const foreignViewModels = this.viewModelStoreService.getMany(
                    relation.foreignViewModel,
                    model[relation.ownIdKey]
                );
                this.sortViewModels(foreignViewModels, relation.order);
                return foreignViewModels;
            } else if (relation.type === 'M2O') {
                const foreignViewModel = this.viewModelStoreService.get(
                    relation.foreignViewModel,
                    model[relation.ownIdKey]
                );
                return foreignViewModel;
            }
        } else if (isReverseRelationDefinition(relation)) {
            if (relation.type === 'M2M') {
                const foreignViewModels = this.viewModelStoreService.filter(
                    relation.foreignViewModel,
                    foreignViewModel =>
                        foreignViewModel[relation.foreignIdKey] &&
                        foreignViewModel[relation.foreignIdKey].constructor === Array &&
                        foreignViewModel[relation.foreignIdKey].includes(model.id)
                );
                this.sortViewModels(foreignViewModels, relation.order);
                return foreignViewModels;
            } else if (relation.type === 'O2M') {
                const foreignViewModels = this.viewModelStoreService.filter(
                    relation.foreignViewModel,
                    foreignViewModel =>
                        foreignViewModel[relation.foreignIdKey] && foreignViewModel[relation.foreignIdKey] === model.id
                );
                this.sortViewModels(foreignViewModels, relation.order);
                return foreignViewModels;
            } else if (relation.type === 'M2O') {
                const foreignViewModel = this.viewModelStoreService.find(
                    relation.foreignViewModel,
                    _foreignViewModel =>
                        _foreignViewModel[relation.foreignIdKey] &&
                        _foreignViewModel[relation.foreignIdKey] === model.id
                );
                return foreignViewModel;
            }
        } else if (isGenericRelationDefinition(relation)) {
            const contentObject = this.viewModelStoreService.get<BaseViewModel>(
                model[relation.ownContentObjectDataKey].collection,
                model[relation.ownContentObjectDataKey].id
            );
            if (contentObject && relation.isVForeign(contentObject)) {
                return contentObject;
            }
        } else if (isCustomRelationDefinition(relation)) {
            return relation.get(model, viewModel);
        }
    }

    public handleCachedRelation<V extends BaseViewModel>(
        property: string,
        target: V,
        model: BaseModel,
        viewModel: BaseViewModel,
        relation: RelationDefinition
    ): any {
        // No cache for reverse relations.
        // The issue: we cannot invalidate the cache, if a new object is created (The
        // following example is for a O2M foreign relation):
        // There is no possibility to detect the create case: The target does not update,
        // all related models does not update. The autoupdate does not provide the created-
        // information. So we may check, if the relaten has changed in length every time. But
        // this is the same as just resolving the relation every time it is requested. So no cache here.
        if (isReverseRelationDefinition(relation)) {
            return this.handleRelation(model, viewModel, relation) as BaseViewModel | BaseViewModel[];
        }

        let result: any;

        const cacheProperty = '__' + property;
        const cachePropertyChangeIds = cacheProperty + '_cids';
        let cached: boolean = cacheProperty in target;
        let changeIds: CacheChangeIds | null = null;
        if (cached) {
            result = target[cacheProperty];
            changeIds = target[cachePropertyChangeIds];
        }

        if (!isCustomRelationDefinition(relation)) {
            if (cached) {
                cached = this.relationCacheService.checkCacheValidity(changeIds);
            }

            if (!cached) {
                result = this.handleRelation(model, viewModel, relation) as BaseViewModel | BaseViewModel[];

                if (result) {
                    // Cache it:
                    target[cacheProperty] = result;
                    const newChangeIds = {};
                    if (Array.isArray(result)) {
                        result.forEach(
                            (_vm: BaseViewModel) =>
                                (newChangeIds[_vm.elementId] = this.relationCacheService.query(_vm.elementId))
                        );
                    } else {
                        newChangeIds[result.elementId] = this.relationCacheService.query(result.elementId);
                    }
                    target[cachePropertyChangeIds] = newChangeIds;
                } else {
                    delete target[cacheProperty];
                }
            }
        } else {
            // Custom relations
            const obj = relation.getCacheObjectToCheck(viewModel);
            if (cached) {
                if (obj && changeIds && changeIds[obj.elementId]) {
                    cached = this.relationCacheService.query(obj.elementId) === changeIds[obj.elementId];
                } else {
                    cached = false;
                }
            }

            if (!cached) {
                result = this.handleRelation(model, viewModel, relation);

                if (result && obj) {
                    target[cacheProperty] = result;
                    target[cachePropertyChangeIds] = {};
                    target[cachePropertyChangeIds][obj.elementId] = this.relationCacheService.query(obj.elementId);
                } else {
                    delete target[cachePropertyChangeIds];
                }
            }
        }

        return result;
    }

    /**
     * Sorts the array of foreign view models in the given view models for the given relation.
     */
    public sortViewModels(viewModels: BaseViewModel[], order?: string): void {
        viewModels.sort((a: BaseViewModel, b: BaseViewModel) => {
            if (!order || a[order] === b[order]) {
                return a.id - b.id;
            } else {
                return a[order] - b[order];
            }
        });
    }

    public createViewModel<M extends BaseModel, V extends BaseViewModel>(
        model: M,
        viewModelCtor: ViewModelConstructor<V>,
        relationsByKey: { [key: string]: RelationDefinition },
        nestedModelDescriptors: NestedModelDescriptors
    ): V {
        let viewModel = new viewModelCtor(model);
        viewModel = new Proxy(viewModel, {
            get: (target: V, property) => {
                let result: any;
                const _model: M = target.getModel();
                const relation = typeof property === 'string' ? relationsByKey[property] : null;

                // try to find a getter for property
                if (property in target) {
                    // iterate over prototype chain
                    let prototypeFunc = viewModelCtor,
                        descriptor = null;
                    do {
                        descriptor = Object.getOwnPropertyDescriptor(prototypeFunc.prototype, property);
                        if (!descriptor || !descriptor.get) {
                            prototypeFunc = Object.getPrototypeOf(prototypeFunc);
                        }
                    } while (!(descriptor && descriptor.get) && prototypeFunc && prototypeFunc.prototype);

                    if (descriptor && descriptor.get) {
                        // if getter was found in prototype chain, bind it with this proxy for right `this` access
                        result = descriptor.get.bind(viewModel)();
                    } else {
                        result = target[property];
                    }
                } else if (property in _model) {
                    result = _model[property];
                } else if (relation) {
                    result = this.handleCachedRelation(<any>property, target, _model, viewModel, relation);
                }
                return result;
            }
        });

        // set nested models
        (nestedModelDescriptors[model.collectionString] || []).forEach(
            (modelDescriptor: ModelDescriptor<BaseModel, BaseViewModel>) => {
                const nestedModels = (model[modelDescriptor.ownKey] || []).map((nestedModel: object) => {
                    return new modelDescriptor.foreignModel(nestedModel);
                });
                const nestedViewModels = nestedModels.map(nestedModel => {
                    const nestedViewModel = this.createViewModel(
                        nestedModel,
                        modelDescriptor.foreignViewModel,
                        modelDescriptor.relationDefinitionsByKey,
                        nestedModelDescriptors
                    );
                    Object.keys(modelDescriptor.titles || {}).forEach(name => {
                        nestedViewModel[name] = () => modelDescriptor.titles[name](nestedViewModel);
                    });
                    return nestedViewModel;
                });
                this.sortViewModels(nestedViewModels, modelDescriptor.order);

                viewModel[modelDescriptor.ownKey] = nestedViewModels;
            }
        );
        return viewModel;
    }
}
