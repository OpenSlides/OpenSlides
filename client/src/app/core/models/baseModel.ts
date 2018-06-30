import { Observable } from 'rxjs';

import { DS } from 'app/core/services/DS.service';

const INVALID_COLLECTION_STRING = 'invalid-collection-string';

export type ModelId = number | string;

export abstract class BaseModel {
    abstract id: ModelId;

    constructor() {}

    // Typescript does not allow static and abstract at the same time :(((
    static getCollectionString(): string {
        return INVALID_COLLECTION_STRING;
    }

    private static getCheckedCollectionString(): string {
        const collectionString: string = this.getCollectionString();
        if (collectionString === INVALID_COLLECTION_STRING) {
            throw new ImproperlyConfigured(
                'Invalid collection string: Please override the static getCollectionString method!'
            );
        }
        return collectionString;
    }

    protected static _get<T extends BaseModel>(id: ModelId): T | undefined {
        return DS.get(this.getCheckedCollectionString(), id) as T;
    }
    protected static _getAll<T extends BaseModel>(): T[] {
        return DS.getAll(this.getCheckedCollectionString()) as T[];
    }
    protected static _filter<T extends BaseModel>(callback): T[] {
        return DS.filter(this.getCheckedCollectionString(), callback) as T[];
    }

    abstract getCollectionString(): string;

    save(): Observable<any> {
        return DS.save(this);
    }

    delete(): Observable<any> {
        return DS.delete(this);
    }
}
