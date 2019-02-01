import { Injectable } from '@angular/core';

import { ModelConstructor, BaseModel } from '../../shared/models/base/base-model';
import { BaseRepository } from 'app/core/repositories/base-repository';
import { ViewModelConstructor, BaseViewModel } from 'app/site/base/base-view-model';

/**
 * Holds a mapping entry with the matching collection string,
 * model constructor, view model constructor and the repository
 */
type MappingEntry = [
    string,
    ModelConstructor<BaseModel>,
    ViewModelConstructor<BaseViewModel>,
    BaseRepository<BaseViewModel, BaseModel>
];

/**
 * Registeres the mapping between collection strings, models constructors, view
 * model constructors and repositories.
 * All models ned to be registered!
 */
@Injectable({
    providedIn: 'root'
})
export class CollectionStringMapperService {
    /**
     * Maps collection strings to mapping entries
     */
    private collectionStringMapping: {
        [collectionString: string]: MappingEntry;
    } = {};

    /**
     * Maps models to mapping entries
     */
    private modelMapping: {
        [modelName: string]: MappingEntry;
    } = {};

    /**
     * Maps view models to mapping entries
     */
    private viewModelMapping: {
        [viewModelname: string]: MappingEntry;
    } = {};

    /**
     * Maps repositories to mapping entries
     */
    private repositoryMapping: {
        [repositoryName: string]: MappingEntry;
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
        const entry: MappingEntry = [collectionString, model, viewModel, repository];
        this.collectionStringMapping[collectionString] = entry;
        this.modelMapping[model.name] = entry;
        this.viewModelMapping[viewModel.name] = entry;
        this.repositoryMapping[repository.name] = entry;
    }

    // The following accessors are for giving one of EntryType by given a different object
    // of EntryType.

    public getCollectionStringFromModelConstructor<M extends BaseModel>(ctor: ModelConstructor<M>): string {
        return this.modelMapping[ctor.name][0];
    }
    public getCollectionStringFromViewModelConstructor<V extends BaseViewModel>(ctor: ViewModelConstructor<V>): string {
        return this.viewModelMapping[ctor.name][0];
    }
    public getCollectionStringFromRepository<M extends BaseModel, V extends BaseViewModel>(
        repository: BaseRepository<V, M>
    ): string {
        return this.repositoryMapping[repository.name][0];
    }

    public getModelConstructorFromCollectionString<M extends BaseModel>(collectionString: string): ModelConstructor<M> {
        return this.collectionStringMapping[collectionString][1] as ModelConstructor<M>;
    }
    public getModelConstructorFromViewModelConstructor<V extends BaseViewModel, M extends BaseModel>(
        ctor: ViewModelConstructor<V>
    ): ModelConstructor<M> {
        return this.viewModelMapping[ctor.name][1] as ModelConstructor<M>;
    }
    public getModelConstructorFromRepository<V extends BaseViewModel, M extends BaseModel>(
        repository: BaseRepository<V, M>
    ): ModelConstructor<M> {
        return this.repositoryMapping[repository.name][1] as ModelConstructor<M>;
    }

    public getViewModelConstructorFromCollectionString<M extends BaseViewModel>(
        collectionString: string
    ): ViewModelConstructor<M> {
        return this.collectionStringMapping[collectionString][2] as ViewModelConstructor<M>;
    }
    public getViewModelConstructorFromModelConstructor<V extends BaseViewModel, M extends BaseModel>(
        ctor: ModelConstructor<M>
    ): ViewModelConstructor<V> {
        return this.modelMapping[ctor.name][2] as ViewModelConstructor<V>;
    }
    public getViewModelConstructorFromRepository<V extends BaseViewModel, M extends BaseModel>(
        repository: BaseRepository<V, M>
    ): ViewModelConstructor<V> {
        return this.repositoryMapping[repository.name][2] as ViewModelConstructor<V>;
    }

    public getRepositoryFromCollectionString<V extends BaseViewModel, M extends BaseModel>(
        collectionString: string
    ): BaseRepository<V, M> {
        return this.collectionStringMapping[collectionString][3] as BaseRepository<V, M>;
    }
    public getRepositoryFromModelConstructor<V extends BaseViewModel, M extends BaseModel>(
        ctor: ModelConstructor<M>
    ): BaseRepository<V, M> {
        return this.modelMapping[ctor.name][3] as BaseRepository<V, M>;
    }
    public getRepositoryFromViewModelConstructor<V extends BaseViewModel, M extends BaseModel>(
        ctor: ViewModelConstructor<V>
    ): BaseRepository<V, M> {
        return this.viewModelMapping[ctor.name][3] as BaseRepository<V, M>;
    }
}
