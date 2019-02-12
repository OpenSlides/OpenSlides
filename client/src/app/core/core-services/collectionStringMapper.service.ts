import { Injectable } from '@angular/core';

import { ModelConstructor, BaseModel } from '../../shared/models/base/base-model';
import { BaseRepository } from 'app/core/repositories/base-repository';
import { ViewModelConstructor, BaseViewModel } from 'app/site/base/base-view-model';

/**
 * Unifies the ModelConstructor and ViewModelConstructor.
 */
interface UnifiedConstructors {
    COLLECTIONSTRING: string;
    new (...args: any[]): any;
}

/**
 * Every types supported: (View)ModelConstructors, repos and collectionstrings.
 */
type TypeIdentifier = UnifiedConstructors | BaseRepository<any, any> | string;

/**
 * Registeres the mapping between collection strings, models constructors, view
 * model constructors and repositories.
 * All models need to be registered!
 */
@Injectable({
    providedIn: 'root'
})
export class CollectionStringMapperService {
    /**
     * Maps collection strings to mapping entries
     */
    private collectionStringMapping: {
        [collectionString: string]: [
            ModelConstructor<BaseModel>,
            ViewModelConstructor<BaseViewModel>,
            BaseRepository<BaseViewModel, BaseModel>
        ];
    } = {};

    public constructor() {}

    /**
     * Registers the combination of a collection string, model, view model and repository
     * @param collectionString
     * @param model
     */
    public registerCollectionElement<V extends BaseViewModel, M extends BaseModel>(
        collectionString: string,
        model: ModelConstructor<M>,
        viewModel: ViewModelConstructor<V>,
        repository: BaseRepository<V, M>
    ): void {
        this.collectionStringMapping[collectionString] = [model, viewModel, repository];
    }

    /**
     * @param obj The object to get the collection string from.
     * @returns the collectionstring
     */
    public getCollectionString(obj: TypeIdentifier): string {
        if (typeof obj === 'string') {
            return obj;
        } else {
            return obj.COLLECTIONSTRING;
        }
    }

    /**
     * @param obj The object to get the model constructor from.
     * @returns the model constructor
     */
    public getModelConstructor<M extends BaseModel>(obj: TypeIdentifier): ModelConstructor<M> {
        return this.collectionStringMapping[this.getCollectionString(obj)][0] as ModelConstructor<M>;
    }

    /**
     * @param obj The object to get the view model constructor from.
     * @returns the view model constructor
     */
    public getViewModelConstructor<M extends BaseViewModel>(obj: TypeIdentifier): ViewModelConstructor<M> {
        return this.collectionStringMapping[this.getCollectionString(obj)][1] as ViewModelConstructor<M>;
    }

    /**
     * @param obj The object to get the repository from.
     * @returns the repository
     */
    public getRepository<V extends BaseViewModel, M extends BaseModel>(obj: TypeIdentifier): BaseRepository<V, M> {
        return this.collectionStringMapping[this.getCollectionString(obj)][2] as BaseRepository<V, M>;
    }
}
