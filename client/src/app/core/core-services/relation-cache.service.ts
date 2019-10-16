import { Injectable } from '@angular/core';

export interface CacheChangeIds {
    [elementId: string]: number;
}

/**
 * Handles caching metadata for the relation manager.
 *
 * Mainly holds an object mapping element ids to their last updates change ids.
 * The manager can detect invalid caches, if the change id in the cache's metadata
 * diverges from the change ids in this service.
 */
@Injectable({
    providedIn: 'root'
})
export class RelationCacheService {
    private cache: {
        [elementId: string]: number;
    } = {};

    public constructor() {}

    /**
     * Reset the cache.
     */
    public reset(): void {
        this.cache = {};
    }

    /**
     * Deletes models from this cache.
     *
     * @param collection Collection
     * @param ids Ids from all models in the collection
     */
    public registerDeletedModels(collection: string, ids: number[]): void {
        ids.forEach(id => {
            const elementId = collection + ':' + id;
            delete this.cache[elementId];
        });
    }

    /**
     * Adds models to the cache with the given change id.
     *
     * @param collection Collection
     * @param ids Ids from all models in the collection
     * @param changeId The change id to put into the cache
     */
    public registerChangedModels(collection: string, ids: number[], changeId: number): void {
        ids.forEach(id => {
            const elementId = collection + ':' + id;
            this.cache[elementId] = changeId;
        });
    }

    /**
     * Queries the change id for one element.
     *
     * @param elementId The element to query.
     */
    public query(elementId: string): number | null {
        return this.cache[elementId] || null;
    }

    /**
     * Checks, if all given change ids are valid.
     */
    public checkCacheValidity(changeIds: CacheChangeIds): boolean {
        if (!changeIds) {
            return false;
        }

        const elementIds = Object.keys(changeIds);
        if (!elementIds.length) {
            return false;
        }

        return elementIds.every(elementId => {
            return this.query(elementId) === changeIds[elementId];
        });
    }
}
