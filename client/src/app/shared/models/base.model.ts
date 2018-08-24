import { OpenSlidesComponent } from 'app/openslides.component';
import { Deserializable } from './deserializable.model';
import { CollectionStringModelMapperService } from '../../core/services/collectionStringModelMapper.service';

/**
 * Define that an ID might be a number or a string.
 */
export type ModelId = number | string;

export interface ModelConstructor {
    new (...args: any[]): BaseModel;
}

/**
 * Abstract parent class to set rules and functions for all models.
 */
export abstract class BaseModel extends OpenSlidesComponent implements Deserializable {
    /**
     * force children of BaseModel to have a collectionString.
     *
     * Has a getter but no setter.
     */
    protected abstract _collectionString: string;

    /**
     * force children of BaseModel to have an id
     */
    abstract id: ModelId;

    /**
     * constructor that calls super from parent class
     */
    protected constructor() {
        super();
    }

    public static registerCollectionElement(collectionString: string, type: any) {
        CollectionStringModelMapperService.registerCollectionElement(collectionString, type);
    }

    /**
     * returns the collectionString.
     *
     * The server and the dataStore use it to identify the collection.
     */
    get collectionString(): string {
        return this._collectionString;
    }

    /**
     * Most simple and most commonly used deserialize function.
     * Inherited to children, can be overwritten for special use cases
     * @param input JSON data for deserialization.
     */
    deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}
