import { Injectable } from '@angular/core';

import { BaseModel } from 'app/shared/models/base/base-model';
import { BaseViewModel, ViewModelConstructor } from 'app/site/base/base-view-model';
import {
    BaseOrderedRelation,
    isCustomRelationDefinition,
    isGenericRelationDefinition,
    isNestedRelationDefinition,
    isNormalRelationDefinition,
    isReverseRelationDefinition,
    RelationDefinition,
    ReverseRelationDefinition
} from '../definitions/relations';
import { ViewModelStoreService } from './view-model-store.service';

/**
 * Manages relations between view models. This service is and should only used by the
 * base repository to offload maanging relations between view models.
 */
@Injectable({
    providedIn: 'root'
})
export class RelationManagerService {
    public constructor(private viewModelStoreService: ViewModelStoreService) {}

    /**
     * Sorts the array of foreign view models in the given view models for the given relation.
     */
    public sortByRelation<V extends BaseViewModel, VForegin extends BaseViewModel>(
        relation: BaseOrderedRelation<VForegin>,
        viewModel: V
    ): void {
        const order = relation.order;
        viewModel['_' + relation.ownKey].sort((a: BaseViewModel, b: BaseViewModel) => {
            if (!order || a[order] === b[order]) {
                return a.id - b.id;
            } else {
                return a[order] - b[order];
            }
        });
    }

    /**
     * Creates a view model from the given model and model ctor. All dependencies will be
     * set accorting to relations.
     */
    public createViewModel<M extends BaseModel, V extends BaseViewModel>(
        model: M,
        modelCtor: ViewModelConstructor<V>,
        relations: RelationDefinition[],
        initialLoading: boolean
    ): V {
        const viewModel = new modelCtor(model) as V;

        relations.forEach(relation => {
            this.setRelationsInViewModel(model, viewModel, relation, initialLoading);
        });

        return viewModel;
    }

    /**
     * Sets one foreign view model in the view model according to the relation and the information
     * from the model.
     */
    protected setRelationsInViewModel<M extends BaseModel, V extends BaseViewModel>(
        model: M,
        viewModel: V,
        relation: RelationDefinition,
        initialLoading: boolean
    ): void {
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
                viewModel['_' + relation.ownKey] = foreignViewModels;
                this.sortByRelation(relation, viewModel);
                if (relation.afterSetRelation) {
                    relation.afterSetRelation(viewModel, foreignViewModels);
                }
            } else if (relation.type === 'M2O') {
                const foreignViewModel = this.viewModelStoreService.get(
                    relation.foreignViewModel,
                    model[relation.ownIdKey]
                );
                viewModel['_' + relation.ownKey] = foreignViewModel;
                if (relation.afterSetRelation) {
                    relation.afterSetRelation(viewModel, foreignViewModel);
                }
            }
        } else if (isReverseRelationDefinition(relation) && !initialLoading) {
            if (relation.type === 'M2M') {
                const foreignViewModels = this.viewModelStoreService.filter(
                    relation.foreignViewModel,
                    foreignViewModel =>
                        foreignViewModel[relation.foreignIdKey] &&
                        foreignViewModel[relation.foreignIdKey].constructor === Array &&
                        foreignViewModel[relation.foreignIdKey].includes(model.id)
                );
                viewModel['_' + relation.ownKey] = foreignViewModels;
                this.sortByRelation(relation, viewModel);
            } else if (relation.type === 'O2M') {
                const foreignViewModels = this.viewModelStoreService.filter(
                    relation.foreignViewModel,
                    foreignViewModel =>
                        foreignViewModel[relation.foreignIdKey] && foreignViewModel[relation.foreignIdKey] === model.id
                );
                viewModel['_' + relation.ownKey] = foreignViewModels;
                this.sortByRelation(relation, viewModel);
            } else if (relation.type === 'M2O') {
                const foreignViewModel = this.viewModelStoreService.find(
                    relation.foreignViewModel,
                    _foreignViewModel =>
                        _foreignViewModel[relation.foreignIdKey] &&
                        _foreignViewModel[relation.foreignIdKey] === model.id
                );
                viewModel['_' + relation.ownKey] = foreignViewModel;
            }
        } else if (isNestedRelationDefinition(relation)) {
            const foreignModels = model[relation.ownKey].map(m => new relation.foreignModel(m));
            const foreignViewModels: BaseViewModel[] = foreignModels.map((foreignModel: BaseModel) =>
                this.createViewModel(
                    foreignModel,
                    relation.foreignViewModel,
                    relation.relationDefinition || [],
                    initialLoading
                )
            );
            viewModel['_' + relation.ownKey] = foreignViewModels;
            this.sortByRelation(relation, viewModel);
        } else if (isGenericRelationDefinition(relation)) {
            const contentObject = this.viewModelStoreService.get<BaseViewModel>(
                model[relation.ownContentObjectDataKey].collection,
                model[relation.ownContentObjectDataKey].id
            );
            if (contentObject && relation.isVForeign(contentObject)) {
                viewModel['_' + relation.ownKey] = contentObject;
            }
        } else if (isCustomRelationDefinition(relation)) {
            relation.setRelations(model, viewModel);
        }
    }

    /**
     * Updates an own view model with an deleted model implicit given by the deletedId and
     * the collection via the relation.
     *
     * @return true, if something was updated.
     */
    public updateSingleDependencyForDeletedModel(
        ownViewModel: BaseViewModel,
        relation: ReverseRelationDefinition,
        deletedId: number
    ): boolean {
        // In both relations, the ownViewModel holds an array of foreignViewModels. Try to find the deleted
        // foreignViewModel in this array and remove it.
        if (relation.type === 'O2M' || relation.type === 'M2M') {
            const ownModelArray = <any>ownViewModel['_' + relation.ownKey];
            if (!ownModelArray) {
                return false;
            }
            // We have the array of foreign view models for our own view model. Put the foreignViewModel
            // into it (replace or push).
            const index = ownModelArray.findIndex(foreignViewModel => foreignViewModel.id === deletedId);
            if (index > -1) {
                ownModelArray.splice(index, 1);
                return true;
            }
        }

        // The ownViewModel holds one foreignViewModel. Check, if it is the deleted one.
        else if (relation.type === 'M2O') {
            if (ownViewModel['_' + relation.ownKey] && ownViewModel['_' + relation.ownKey].id === deletedId) {
                ownViewModel['_' + relation.ownKey] = null;
                return true;
            }
        }

        return false;
    }

    /**
     * Updates an own view model with an implicit given model by the collection and changedId.
     *
     * @return true, if something was updated.
     */
    public updateSingleDependencyForChangedModel(
        ownViewModel: BaseViewModel,
        relation: RelationDefinition,
        collection: string,
        changedId: number
    ): boolean {
        if (isNormalRelationDefinition(relation)) {
            if (relation.type === 'M2M' || relation.type === 'O2M') {
                // For the side of the ownViewModel these relations are the same:
                // the ownViewModel does have may foreign models and we do have a normal relation (not a
                // reverse one), we just set the many-part of the relation in the ownViewModel.
                if (
                    ownViewModel[relation.ownIdKey] &&
                    ownViewModel[relation.ownIdKey].constructor === Array &&
                    ownViewModel[relation.ownIdKey].includes(changedId) // The foreign view model belongs to us.
                ) {
                    const foreignViewModel = <any>this.viewModelStoreService.get(collection, changedId);
                    this.setForeingViewModelInOwnViewModelArray(foreignViewModel, ownViewModel, relation.ownKey);
                    if (relation.afterDependencyChange) {
                        relation.afterDependencyChange(ownViewModel, foreignViewModel);
                    }
                    return true;
                }
            } else if (relation.type === 'M2O') {
                if (ownViewModel[relation.ownIdKey] === <any>changedId) {
                    // Check, if this is the matching foreign view model.
                    const foreignViewModel = this.viewModelStoreService.get(collection, changedId);
                    ownViewModel['_' + relation.ownKey] = <any>foreignViewModel;
                    if (relation.afterDependencyChange) {
                        relation.afterDependencyChange(ownViewModel, foreignViewModel);
                    }
                    return true;
                }
            }
        } else if (isReverseRelationDefinition(relation)) {
            const foreignViewModel = <any>this.viewModelStoreService.get(collection, changedId);

            // The foreign model has one id. Check, if the ownViewModel is the matching view model.
            // If so, add the foreignViewModel to the array from the ownViewModel (with many foreignViewModels)
            // If not, check, if the model _was_ in our foreignViewModel array and remove it.
            if (relation.type === 'O2M') {
                if (foreignViewModel[relation.foreignIdKey] === ownViewModel.id) {
                    this.setForeingViewModelInOwnViewModelArray(foreignViewModel, ownViewModel, relation.ownKey);
                    return true;
                } else {
                    const ownViewModelArray = <any>ownViewModel['_' + relation.ownKey];
                    if (ownViewModelArray) {
                        // We have the array of foreign view models for our own view model. Remove the foreignViewModel (if it was there).
                        const index = ownViewModelArray.findIndex(
                            _foreignViewModel => _foreignViewModel.id === foreignViewModel.id
                        );
                        if (index > -1) {
                            ownViewModelArray.splice(index, 1);
                            return true;
                        }
                    }
                }
            }

            // The foreign model should hold an array of ids. If the ownViewModel is in it, the foreignViewModel must
            // be included into the array from the ownViewModel (with many foreignViewModels).
            // If not, check, if the model _was_ in our foreignViewModel array and remove it.
            else if (relation.type === 'M2M') {
                if (
                    foreignViewModel[relation.foreignIdKey] &&
                    foreignViewModel[relation.foreignIdKey].constructor === Array &&
                    foreignViewModel[relation.foreignIdKey].includes(ownViewModel.id)
                ) {
                    this.setForeingViewModelInOwnViewModelArray(foreignViewModel, ownViewModel, relation.ownKey);
                    return true;
                } else {
                    const ownViewModelArray = <any>ownViewModel['_' + relation.ownKey];
                    if (ownViewModelArray) {
                        // We have the array of foreign view models for our own view model. Remove the foreignViewModel (if it was there).
                        const index = ownViewModelArray.findIndex(
                            _foreignViewModel => _foreignViewModel.id === foreignViewModel.id
                        );
                        if (index > -1) {
                            ownViewModelArray.splice(index, 1);
                            return true;
                        }
                    }
                }
            }

            // The foreign model should hold an array of ids. If the ownViewModel is in it, the foreignViewModel is the
            // one and only matching model for the ownViewModel. If the ownViewModel is not in it, check if the
            // foreignViewModel _was_ the matching model. If so, set the reference to null.
            else if (relation.type === 'M2O') {
                if (
                    foreignViewModel[relation.foreignIdKey] &&
                    foreignViewModel[relation.foreignIdKey].constructor === Array &&
                    foreignViewModel[relation.foreignIdKey].includes(ownViewModel.id)
                ) {
                    ownViewModel['_' + relation.ownKey] = foreignViewModel;
                    return true;
                } else if (
                    ownViewModel['_' + relation.ownKey] &&
                    ownViewModel['_' + relation.ownKey].id === foreignViewModel.id
                ) {
                    ownViewModel['_' + relation.ownKey] = null;
                }
            }
        } else if (isNestedRelationDefinition(relation)) {
            let updated = false;
            (relation.relationDefinition || []).forEach(nestedRelation => {
                const nestedViewModels = ownViewModel[relation.ownKey] as BaseViewModel[];
                nestedViewModels.forEach(nestedViewModel => {
                    if (
                        this.updateSingleDependencyForChangedModel(
                            nestedViewModel,
                            nestedRelation,
                            collection,
                            changedId
                        )
                    ) {
                        updated = true;
                    }
                });
            });
            return updated;
        } else if (isCustomRelationDefinition(relation)) {
            const foreignViewModel = <any>this.viewModelStoreService.get(collection, changedId);
            return relation.updateDependency(ownViewModel, foreignViewModel);
        } else if (isGenericRelationDefinition(relation)) {
            const foreignModel = <any>this.viewModelStoreService.get(collection, changedId);
            if (
                foreignModel &&
                foreignModel.collectionString === ownViewModel[relation.ownContentObjectDataKey].collection &&
                foreignModel.id === ownViewModel[relation.ownContentObjectDataKey].id
            ) {
                if (relation.isVForeign(foreignModel)) {
                    ownViewModel['_' + relation.ownKey] = foreignModel;
                    return true;
                } else {
                    console.warn(`The object is not an ${relation.VForeignVerbose}:` + foreignModel);
                }
            }
        }

        return false;
    }

    private setForeingViewModelInOwnViewModelArray(
        foreignViewModel: BaseViewModel,
        ownViewModel: BaseViewModel,
        ownKey: string
    ): void {
        let ownViewModelArray = <any>ownViewModel['_' + ownKey];
        if (!ownViewModelArray) {
            ownViewModel['_' + ownKey] = [];
            ownViewModelArray = <any>ownViewModel['_' + ownKey]; // get the new reference
        }
        // We have the array of foreign view models for our own view model. Put the foreignViewModel
        // into it (replace or push).
        const index = ownViewModelArray.findIndex(_foreignViewModel => _foreignViewModel.id === foreignViewModel.id);
        if (index < 0) {
            ownViewModelArray.push(foreignViewModel);
        } else {
            ownViewModelArray[index] = foreignViewModel;
        }
    }
}
