import { Observable, of } from 'rxjs';

import { ImproperlyConfiguredError } from 'app/core/exceptions';
import { BaseModel, ModelId } from 'app/core/models/baseModel';

interface Collection {
    [id: number]: BaseModel;
}

interface DataStore {
    [collectionString: string]: Collection;
}

export class DS {
    static DS: DataStore;

    private constructor() {} // Just a static class!

    static get(collectionString: string, id: ModelId): BaseModel | undefined {
        const collection: Collection = DS[collectionString];
        if (!collection) {
            return;
        }
        const model: BaseModel = collection[id];
        return model;
    }
    static getAll(collectionString: string): BaseModel[] {
        const collection: Collection = DS[collectionString];
        if (!collection) {
            return [];
        }
        return Object.values(collection);
    }
    // TODO: type for callback function
    static filter(collectionString: string, callback): BaseModel[] {
        return this.getAll(collectionString).filter(callback);
    }

    static inject(collectionString: string, model: BaseModel): void {
        if (!model.id) {
            throw new ImproperlyConfiguredError('The model must have an id!');
        }
        if (model.getCollectionString() !== collectionString) {
            throw new ImproperlyConfiguredError('The model you try to insert has not the right collection string');
        }
        if (!DS[collectionString]) {
            DS[collectionString] = {};
        }
        DS[collectionString][model.id] = model;
    }

    static injectMany(collectionString: string, models: BaseModel[]): void {
        models.forEach(model => {
            DS.inject(collectionString, model);
        });
    }

    static eject(collectionString: string, id: ModelId) {
        if (DS[collectionString]) {
            delete DS[collectionString][id];
        }
    }
    static ejectMany(collectionString: string, ids: ModelId[]) {
        ids.forEach(id => {
            DS.eject(collectionString, id);
        });
    }

    // TODO remove the any there and in BaseModel.
    static save(model: BaseModel): Observable<any> {
        if (!model.id) {
            throw new ImproperlyConfiguredError('The model must have an id!');
        }
        const collectionString: string = model.getCollectionString();
        // make http request to the server
        // if this was a success, inject the model into the DS
        return of();
    }

    // TODO remove the any there and in BaseModel.
    static delete(model: BaseModel): Observable<any> {
        if (!model.id) {
            throw new ImproperlyConfiguredError('The model must have an id!');
        }
        const collectionString: string = model.getCollectionString();
        // make http request to the server
        // if this was a success, eject the model from the DS
        return of();
    }
}
