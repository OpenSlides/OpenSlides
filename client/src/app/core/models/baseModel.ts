import { Observable } from 'rxjs';

// import { DS } from 'app/core/services/DS.service';
import { ImproperlyConfiguredError } from 'app/core/exceptions';

const INVALID_COLLECTION_STRING = 'invalid-collection-string';

export type ModelId = number | string;

export abstract class BaseModel {
    static collectionString = INVALID_COLLECTION_STRING;
    id: ModelId;

    constructor(id: ModelId) {
        this.id = id;
    }

    // convert an serialized version of the model to an instance of the class
    // jsonString is usually the server respince
    // T is the target model, User, Motion, Whatever
    // demands full functionening Models with constructors
    static fromJSON(jsonString: {}, Type): BaseModel {
        // create an instance of the User class
        const model = Object.create(Type.prototype);
        // copy all the fields from the json object
        return Object.assign(model, jsonString);
    }

    public getCollectionString(): string {
        return BaseModel.collectionString;
    }

    //TODO document this function.
    // public getCheckedCollectionString(): string {
    //     if (this.collectionString === INVALID_COLLECTION_STRING) {
    //         throw new ImproperlyConfiguredError(
    //             'Invalid collection string: Please override the static getCollectionString method!'
    //         );
    //     }
    //     return collectionString;
    // }
}
