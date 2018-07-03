import { Observable } from 'rxjs';

// import { DS } from 'app/core/services/DS.service';
import { ImproperlyConfiguredError } from 'app/core/exceptions';

const INVALID_COLLECTION_STRING = 'invalid-collection-string';

export type ModelId = number | string;

export abstract class BaseModel {
    id: ModelId;

    constructor() {}

    // convert an serialized version of the model to an instance of the class
    // jsonString is usually the server respince
    // T is the target model, User, Motion, Whatever
    // demands full functionening Models with constructors
    static fromJSON(jsonString: {}, T): BaseModel {
        // create an instance of the User class
        const model = Object.create(T.prototype);
        // copy all the fields from the json object
        return Object.assign(model, jsonString);
    }

    //hast to be overwritten by the children.
    //Could be more generic: e.g. a model-enum
    public getCollectionString(): string {
        return INVALID_COLLECTION_STRING;
    }

    //TODO document this function.
    public getCheckedCollectionString(): string {
        const collectionString: string = this.getCollectionString();
        if (collectionString === INVALID_COLLECTION_STRING) {
            throw new ImproperlyConfiguredError(
                'Invalid collection string: Please override the static getCollectionString method!'
            );
        }
        return collectionString;
    }
}
