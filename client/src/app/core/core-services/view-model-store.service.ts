import { Injectable } from '@angular/core';

import { BaseViewModel, ViewModelConstructor } from 'app/site/base/base-view-model';
import { BaseRepository } from '../repositories/base-repository';
import { CollectionStringMapperService } from './collection-string-mapper.service';

/**
 * This service takes care of handling view models.
 */
@Injectable({
    providedIn: 'root'
})
export class ViewModelStoreService {
    /**
     * @param mapperService
     */
    public constructor(private mapperService: CollectionStringMapperService) {}

    /**
     * gets the repository from a collection string or a view model constructor.
     *
     * @param collectionType The collection string or constructor.
     */
    private getRepository<V extends BaseViewModel>(
        collectionType: ViewModelConstructor<V> | string
    ): BaseRepository<V, any, any> {
        return this.mapperService.getRepository(collectionType) as BaseRepository<V, any, any>;
    }

    /**
     * Returns the view model identified by the collectionString and id
     *
     * @param collectionString The collection of the view model
     * @param id The id of the view model
     */
    public get<V extends BaseViewModel>(collectionType: ViewModelConstructor<V> | string, id: number): V {
        return this.getRepository(collectionType).getViewModel(id);
    }

    /**
     * Returns all view models for the given ids.
     *
     * @param collectionType The collection of the view model
     * @param ids All ids to match
     */
    public getMany<T extends BaseViewModel>(collectionType: ViewModelConstructor<T> | string, ids?: number[]): T[] {
        if (!ids) {
            return [];
        }
        const repository = this.getRepository<T>(collectionType);

        return ids
            .map(id => {
                return repository.getViewModel(id);
            })
            .filter(model => !!model); // remove non valid models.
    }

    /**
     * Gets all view models from a collection
     *
     * @param collectionString  The collection
     * @returns all models from the collection
     */
    public getAll<T extends BaseViewModel>(collectionType: ViewModelConstructor<T> | string): T[] {
        return this.getRepository(collectionType).getViewModelList();
    }

    /**
     * Get all view models from a collection, that satisfy the callback
     *
     * @param collectionString The collection
     * @param callback The function to check
     * @returns all matched view models of the collection
     */
    public filter<T extends BaseViewModel>(
        collectionType: ViewModelConstructor<T> | string,
        callback: (model: T) => boolean
    ): T[] {
        return this.getAll<T>(collectionType).filter(callback);
    }

    /**
     * Finds one view model from the collection, that satisfies the callback
     *
     * @param collectionString The collection
     * @param callback THe callback to satisfy
     * @returns a found view model or null, if nothing was found.
     */
    public find<T extends BaseViewModel>(
        collectionType: ViewModelConstructor<T> | string,
        callback: (model: T) => boolean
    ): T {
        return this.getAll<T>(collectionType).find(callback);
    }
}
