import { OpenSlidesComponent } from 'app/openslides.component';

/**
 * Define that an ID might be a number or a string.
 */
export type ModelId = number | string;

/**
 * Abstract parent class to set rules and functions for all models.
 */
export abstract class BaseModel extends OpenSlidesComponent {
    /**
     * force children of BaseModel to have a collectionString.
     *
     * Has a getter but no setter.
     */
    protected abstract _collectionString: string;

    /**
     * force children of BaseModel to have an `id`
     */
    abstract id: ModelId;

    /**
     * constructor that calls super from parent class
     */
    protected constructor() {
        super();
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
