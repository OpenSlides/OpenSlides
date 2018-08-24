import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

import { ImproperlyConfiguredError } from 'app/core/exceptions';
import { BaseModel, ModelId } from 'app/shared/models/base.model';
import { CacheService } from './cache.service';

/**
 * represents a collection on the Django server, uses an ID to access a {@link BaseModel}.
 *
 * Part of {@link DataStoreService}
 */
interface Collection {
    [id: number]: BaseModel;
}

/**
 * The actual storage that stores collections, accessible by strings.
 *
 * {@link DataStoreService}
 */
interface Storage {
    [collectionString: string]: Collection;
}

/**
 * All mighty DataStore that comes with all OpenSlides components.
 * Use this.DS in an OpenSlides Component to Access the store.
 * Used by a lot of components, classes and services.
 * Changes can be observed
 *
 * FIXME: The injector does not init the HttpClient Service.
 *        Either remove it from DataStore and make an own Service
 *        fix it somehow
 *        or just do-not let the OpenSlidesComponent inject DataStore to it's
 *        children.
 */
@Injectable({
    providedIn: 'root'
})
export class DataStoreService {
    /**
     * Dependency injection, services are singletons 'per scope' and not per app anymore.
     * There will be multiple DataStores, all of them should share the same storage object
     */
    private static store: Storage = {};

    /**
     * Observable subject with changes to enable dynamic changes in models and views
     */
    private static dataStoreSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    /**
     * Empty constructor for dataStore
     * @param http use HttpClient to send models back to the server
     */
    constructor(private cacheService: CacheService) {
        cacheService.test();
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

        const collection: Collection = DataStoreService.store[collectionString];

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
        console.log('Everything in DataStore: ', DataStoreService.store);
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
    add(...models: BaseModel[]): void {
        models.forEach(model => {
            const collectionString = model.collectionString;
            if (!model.id) {
                throw new ImproperlyConfiguredError('The model must have an id!');
            } else if (collectionString === 'invalid-collection-string') {
                throw new ImproperlyConfiguredError('Cannot save a BaseModel');
            }
            if (typeof DataStoreService.store[collectionString] === 'undefined') {
                DataStoreService.store[collectionString] = {};
            }
            DataStoreService.store[collectionString][model.id] = model;
            this.setObservable(model);
        });
    }

    /**
     * removes one or multiple models from dataStore
     * @param Type   The desired BaseModel type to be read from the dataStore
     * @param ...ids An or multiple IDs or a list of IDs of BaseModels. use spread operator ("...") for arrays
     * @example this.DS.remove(User, myUser.id, 3, 4)
     */
    remove(collectionType, ...ids: ModelId[]): void {
        console.log('remove from DS: collection', collectionType);
        console.log('remove from DS: collection', ids);

        let collectionString: string;
        if (typeof collectionType === 'string') {
            collectionString = collectionType;
        } else {
            const tempObject = new collectionType();
            collectionString = tempObject.collectionString;
        }

        ids.forEach(id => {
            if (DataStoreService.store[collectionString]) {
                delete DataStoreService.store[collectionString][id];
            }
        });
    }

    /**
     * Observe the dataStore for changes.
     * @return an observable behaviorSubject
     */
    public getObservable(): Observable<any> {
        return DataStoreService.dataStoreSubject.asObservable();
    }

    /**
     * Informs the observers for changes
     * @param value the change that have been made
     */
    private setObservable(value): void {
        DataStoreService.dataStoreSubject.next(value);
    }
}
