import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';

import { BaseModel, ModelId } from 'app/shared/models/base.model';
import { CacheService } from './cache.service';
import { CollectionStringModelMapperService } from './collectionStringModelMapper.service';

/**
 * represents a collection on the Django server, uses an ID to access a {@link BaseModel}.
 *
 * Part of {@link DataStoreService}
 */
interface ModelCollection {
    [id: number]: BaseModel;
}

/**
 * Represents a serialized collection.
 */
interface JsonCollection {
    [id: number]: string;
}

/**
 * The actual storage that stores collections, accessible by strings.
 *
 * {@link DataStoreService}
 */
interface ModelStorage {
    [collectionString: string]: ModelCollection;
}

/**
 * A storage of serialized collection elements.
 */
interface JsonStorage {
    [collectionString: string]: JsonCollection;
}

/**
 * All mighty DataStore that comes with all OpenSlides components.
 * Use this.DS in an OpenSlides Component to Access the store.
 * Used by a lot of components, classes and services.
 * Changes can be observed
 */
@Injectable({
    providedIn: 'root'
})
export class DataStoreService {
    private static cachePrefix = 'DS:';

    /**
     * Make sure, that the Datastore only be instantiated once.
     */
    private static wasInstantiated = false;

    /** We will store the data twice: One as instances of the actual models in the _store
     * and one serialized version in the _serializedStore for the cache. Both should be updated in
     * all cases equal!
     */
    private modelStore: ModelStorage = {};
    private JsonStore: JsonStorage = {};

    /**
     * Observable subject with changes to enable dynamic changes in models and views
     */
    private dataStoreSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    /**
     * The maximal change id from this DataStore.
     */
    private _maxChangeId = 0;

    /**
     * returns the maxChangeId of the DataStore.
     */
    public get maxChangeId(): number {
        return this._maxChangeId;
    }

    /**
     * Empty constructor for dataStore
     * @param cacheService use CacheService to cache the DataStore.
     */
    constructor(private cacheService: CacheService) {
        if (DataStoreService.wasInstantiated) {
            throw new Error('The Datastore should just be instantiated once!');
        }
        DataStoreService.wasInstantiated = true;
    }

    /**
     * Gets the DataStore from cache and instantiate all models out of the serialized version.
     */
    public initFromCache(): Promise<number> {
        // This promise will be resolved with the maximal change id of the cache.
        return new Promise<number>(resolve => {
            this.cacheService.get<JsonStorage>(DataStoreService.cachePrefix + 'DS').subscribe((store: JsonStorage) => {
                if (store != null) {
                    // There is a store. Deserialize it
                    this.JsonStore = store;
                    this.modelStore = this.deserializeJsonStore(this.JsonStore);
                    // Get the maxChangeId from the cache
                    this.cacheService
                        .get<number>(DataStoreService.cachePrefix + 'maxChangeId')
                        .subscribe((maxChangeId: number) => {
                            if (maxChangeId == null) {
                                maxChangeId = 0;
                            }
                            this._maxChangeId = maxChangeId;
                            resolve(maxChangeId);
                        });
                } else {
                    // No store here, so get all data from the server.
                    resolve(0);
                }
            });
        });
    }

    /**
     * Deserialze the given serializedStorage and returns a Storage.
     */
    private deserializeJsonStore(serializedStore: JsonStorage): ModelStorage {
        const storage: ModelStorage = {};
        Object.keys(serializedStore).forEach(collectionString => {
            storage[collectionString] = {} as ModelCollection;
            const target = CollectionStringModelMapperService.getCollectionStringType(collectionString);
            if (target) {
                Object.keys(serializedStore[collectionString]).forEach(id => {
                    const data = JSON.parse(serializedStore[collectionString][id]);
                    storage[collectionString][id] = new target().deserialize(data);
                });
            }
        });
        return storage;
    }

    /**
     * Clears the complete DataStore and Cache.
     * @param callback
     */
    public clear(callback?: (value: boolean) => void): void {
        this.modelStore = {};
        this.JsonStore = {};
        this._maxChangeId = 0;
        this.cacheService.remove(DataStoreService.cachePrefix + 'DS', () => {
            this.cacheService.remove(DataStoreService.cachePrefix + 'maxChangeId', callback);
        });
    }

    /**
     * Read one, multiple or all ID's from dataStore
     * @param collectionType The desired BaseModel or collectionString to be read from the dataStore
     * @param ids An or multiple IDs or a list of IDs of BaseModel
     * @return The BaseModel-list corresponding to the given ID(s)
     * @example: this.DS.get(User) returns all users
     * @example: this.DS.get(User, 1)
     * @example: this.DS.get(User, ...[1,2,3,4,5])
     * @example: this.DS.get(/core/countdown, 1)
     */
    get(collectionType, ...ids: ModelId[]): BaseModel[] | BaseModel {
        let collectionString: string;
        if (typeof collectionType === 'string') {
            collectionString = collectionType;
        } else {
            //get the collection string by making an empty object
            const tempObject = new collectionType();
            collectionString = tempObject.collectionString;
        }

        const collection: ModelCollection = this.modelStore[collectionString];

        const models = [];
        if (!collection) {
            return models;
        }

        if (ids.length === 0) {
            return Object.values(collection);
        } else {
            ids.forEach(id => {
                const model: BaseModel = collection[id];
                models.push(model);
            });
        }
        return models.length === 1 ? models[0] : models;
    }

    /**
     * Prints the whole dataStore
     */
    printWhole(): void {
        console.log('Everything in DataStore: ', this.modelStore);
    }

    /**
     * Filters the dataStore by type
     * @param Type The desired BaseModel type to be read from the dataStore
     * @param callback a filter function
     * @return The BaseModel-list corresponding to the filter function
     * @example this.DS.filter(User, myUser => myUser.first_name === "Max")
     */
    filter(Type, callback): BaseModel[] {
        // TODO: type for callback function
        let filterCollection = [];
        const typeCollection = this.get(Type);

        if (Array.isArray(typeCollection)) {
            filterCollection = [...filterCollection, ...typeCollection];
        } else {
            filterCollection.push(typeCollection);
        }
        return filterCollection.filter(callback);
    }

    /**
     * Add one or multiple models to dataStore
     * @param ...models The model(s) that shall be add use spread operator ("...")
     * @example this.DS.add(new User(1))
     * @example this.DS.add((new User(2), new User(3)))
     * @example this.DS.add(...arrayWithUsers)
     */
    public add(...models: BaseModel[]): void {
        const maxChangeId = 0;
        models.forEach(model => {
            const collectionString = model.collectionString;
            if (!model.id) {
                throw new Error('The model must have an id!');
            } else if (collectionString === 'invalid-collection-string') {
                throw new Error('Cannot save a BaseModel');
            }
            if (this.modelStore[collectionString] === undefined) {
                this.modelStore[collectionString] = {};
            }
            this.modelStore[collectionString][model.id] = model;

            if (this.JsonStore[collectionString] === undefined) {
                this.JsonStore[collectionString] = {};
            }
            this.JsonStore[collectionString][model.id] = JSON.stringify(model);
            // if (model.changeId > maxChangeId) {maxChangeId = model.maxChangeId;}
            this.setObservable(model);
        });
        this.storeToCache(maxChangeId);
    }

    /**
     * removes one or multiple models from dataStore
     * @param Type   The desired BaseModel type to be read from the dataStore
     * @param ...ids An or multiple IDs or a list of IDs of BaseModels. use spread operator ("...") for arrays
     * @example this.DS.remove(User, myUser.id, 3, 4)
     */
    public remove(collectionType, ...ids: ModelId[]): void {
        let collectionString: string;
        if (typeof collectionType === 'string') {
            collectionString = collectionType;
        } else {
            const tempObject = new collectionType();
            collectionString = tempObject.collectionString;
        }

        const maxChangeId = 0;
        ids.forEach(id => {
            if (this.modelStore[collectionString]) {
                // get changeId from store
                // if (model.changeId > maxChangeId) {maxChangeId = model.maxChangeId;}
                delete this.modelStore[collectionString][id];
            }
            if (this.JsonStore[collectionString]) {
                delete this.JsonStore[collectionString][id];
            }
        });
        this.storeToCache(maxChangeId);
    }

    /**
     * Updates the cache by inserting the serialized DataStore. Also changes the chageId, if it's larger
     * @param maxChangeId
     */
    private storeToCache(maxChangeId: number) {
        this.cacheService.set(DataStoreService.cachePrefix + 'DS', this.JsonStore);
        if (maxChangeId > this._maxChangeId) {
            this._maxChangeId = maxChangeId;
            this.cacheService.set(DataStoreService.cachePrefix + 'maxChangeId', maxChangeId);
        }
    }

    /**
     * Observe the dataStore for changes.
     * @return an observable behaviorSubject
     */
    public getObservable(): Observable<any> {
        return this.dataStoreSubject.asObservable();
    }

    /**
     * Informs the observers for changes
     * @param value the change that have been made
     */
    private setObservable(value): void {
        this.dataStoreSubject.next(value);
    }
}
