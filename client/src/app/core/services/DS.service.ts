import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ImproperlyConfiguredError } from 'app/core/exceptions';
import { BaseModel, ModelId } from 'app/core/models/baseModel';

interface Collection {
    [id: number]: BaseModel;
}

interface DataStore {
    [collectionString: string]: Collection;
}

//Todo: DRY. This is a copy from /authService. probably repository service necessary
const httpOptions = {
    withCredentials: true,
    headers: new HttpHeaders({
        'Content-Type': 'application/json'
    })
};

@Injectable({
    providedIn: 'root'
})
export class DS {
    private store: DataStore = {};

    constructor(private http: HttpClient) {}

    get(collectionString: string, id: ModelId): BaseModel | undefined {
        const collection: Collection = this.store[collectionString];
        if (!collection) {
            return;
        }
        const model: BaseModel = collection[id];
        return model;
    }

    //todo return observable of base model
    getAll(collectionString: string): BaseModel[] {
        const collection: Collection = this.store[collectionString];
        if (!collection) {
            return [];
        }
        return Object.values(collection);
    }

    // TODO: type for callback function
    filter(collectionString: string, callback): BaseModel[] {
        return this.getAll(collectionString).filter(callback);
    }

    inject(model: BaseModel): void {
        const collectionString = model.getCollectionString();
        console.log('the collection string: ', collectionString);

        if (!model.id) {
            throw new ImproperlyConfiguredError('The model must have an id!');
        } else if (collectionString === 'invalid-collection-string') {
            throw new ImproperlyConfiguredError('Cannot save a BaseModel');
        }

        if (typeof this.store[collectionString] === 'undefined') {
            this.store[collectionString] = {};
            console.log('made new collection: ', collectionString);
        }
        this.store[collectionString][model.id] = model;
        console.log('injected ; ', model);
    }

    injectMany(models: BaseModel[]): void {
        models.forEach(model => {
            this.inject(model);
        });
    }

    eject(collectionString: string, id: ModelId) {
        if (this.store[collectionString]) {
            delete this.store[collectionString][id];
        }
    }

    ejectMany(collectionString: string, ids: ModelId[]) {
        ids.forEach(id => {
            this.eject(collectionString, id);
        });
    }

    // TODO remove the any there and in BaseModel.
    save(model: BaseModel): Observable<BaseModel> {
        if (!model.id) {
            throw new ImproperlyConfiguredError('The model must have an id!');
        }
        const collectionString: string = model.getCollectionString();

        //TODO not tested
        return this.http.post<BaseModel>(collectionString + '/', model, httpOptions).pipe(
            tap(response => {
                console.log('the response: ', response);
                this.inject(model);
            })
        );
    }

    // TODO remove the any there and in BaseModel.
    delete(model: BaseModel): Observable<any> {
        if (!model.id) {
            throw new ImproperlyConfiguredError('The model must have an id!');
        }
        const collectionString: string = model.getCollectionString();

        //TODO not tested
        return this.http.post<BaseModel>(collectionString + '/', model, httpOptions).pipe(
            tap(response => {
                console.log('the response: ', response);
                this.eject(collectionString, model.id);
            })
        );
    }
}
