import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ImproperlyConfiguredError } from 'app/core/exceptions';
import { BaseModel, ModelId } from 'app/core/models/baseModel';

interface Collection {
    [id: number]: BaseModel;
}

interface Storrage {
    [collectionString: string]: Collection;
}

// Todo: DRY. This is a copy from /authService. probably repository service necessary
const httpOptions = {
    withCredentials: true,
    headers: new HttpHeaders({
        'Content-Type': 'application/json'
    })
};

@Injectable({
    providedIn: 'root'
})
export class DataStoreService {
    // needs to be static cause becauseusing dependency injection, services are unique for a scope.
    private static store: Storrage = {};

    constructor(private http: HttpClient) {}

    // read one, multiple or all ID's from DataStore
    // example: this.DS.get(User) || (User, 1) || (User, 1, 2) || (User, ...[1,2,3,4,5])
    get(Type, ...ids: ModelId[]): BaseModel[] | BaseModel {
        const collection: Collection = DataStoreService.store[Type.collectionString];
        const models = [];

        if (!collection) {
            return [];
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

    // print the whole store for debug purposes
    printWhole(): void {
        console.log('Everythin in DataStore: ', DataStoreService.store);
    }

    // TODO: type for callback function
    // example: this.DS.filder(User, myUser => myUser.first_name === "Max")
    filter(Type, callback): BaseModel[] {
        let filterCollection = [];
        const typeCollection = this.get(Type);

        if (Array.isArray(typeCollection)) {
            filterCollection = [...filterCollection, ...typeCollection];
        } else {
            filterCollection.push(typeCollection);
        }
        return filterCollection.filter(callback);
    }

    // add one or moultiple models to DataStore
    // use spread operator ("...") for arrays
    // example: this.DS.add(new User(1)) || (new User(2), new User(3)) || (arrayWithUsers)
    add(...models: BaseModel[]): void {
        models.forEach(model => {
            const collectionString = model.getCollectionString();
            if (!model.id) {
                throw new ImproperlyConfiguredError('The model must have an id!');
            } else if (collectionString === 'invalid-collection-string') {
                throw new ImproperlyConfiguredError('Cannot save a BaseModel');
            }
            if (typeof DataStoreService.store[collectionString] === 'undefined') {
                DataStoreService.store[collectionString] = {};
            }
            DataStoreService.store[collectionString][model.id] = model;
            // console.log('add model ', model, ' into Datastore');
        });
    }

    // removes one or moultiple models from DataStore
    // use spread operator ("...") for arrays
    // Type should be any BaseModel
    // example: this.DS.remove(User, 1) || this.DS.remove(User, myUser.id, 3, 4)
    remove(Type, ...ids: ModelId[]): void {
        ids.forEach(id => {
            if (DataStoreService.store[Type.collectionString]) {
                delete DataStoreService.store[Type.collectionString][id];
                console.log(`did remove "${id}" from Datastore "${Type.collectionString}"`);
            }
        });
    }

    // TODO remove the any there and in BaseModel.
    save(model: BaseModel): Observable<BaseModel> {
        if (!model.id) {
            throw new ImproperlyConfiguredError('The model must have an id!');
        }

        // TODO not tested
        return this.http.post<BaseModel>(model.getCollectionString() + '/', model, httpOptions).pipe(
            tap(response => {
                console.log('the response: ', response);
                this.add(model);
            })
        );
    }

    // send a http request to the server to delete the given model
    delete(model: BaseModel): Observable<BaseModel> {
        if (!model.id) {
            throw new ImproperlyConfiguredError('The model must have an id!');
        }

        // TODO not tested
        return this.http.post<BaseModel>(model.getCollectionString() + '/', model, httpOptions).pipe(
            tap(response => {
                console.log('the response: ', response);
                this.remove(model, model.id);
            })
        );
    }
}
