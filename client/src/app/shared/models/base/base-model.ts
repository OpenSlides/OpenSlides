import { OpenSlidesComponent } from 'app/openslides.component';
import { Deserializable } from './deserializable';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';
import { Displayable } from './displayable';

export interface ModelConstructor<T extends BaseModel> {
    new (...args: any[]): T;
}

/**
 * Abstract parent class to set rules and functions for all models.
 */
export abstract class BaseModel extends OpenSlidesComponent implements Deserializable, Displayable {
    /**
     * Register the collection string to the type.
     * @param collectionString
     * @param type
     */
    public static registerCollectionElement(collectionString: string, type: any): void {
        CollectionStringModelMapperService.registerCollectionElement(collectionString, type);
    }

    /**
     * force children of BaseModel to have a collectionString.
     *
     * Has a getter but no setter.
     */
    protected _collectionString: string;

    /**
     * force children of BaseModel to have an id
     */
    public abstract id: number;

    /**
     * constructor that calls super from parent class
     */
    protected constructor(collectionString: string, input?: any) {
        super();
        this._collectionString = collectionString;

        if (input) {
            this.changeNullValuesToUndef(input);
            this.deserialize(input);
        }
    }

    /**
     * Prevent to send literally "null" if should be send
     * @param input object to deserialize
     */
    public changeNullValuesToUndef(input: any): void {
        Object.keys(input).forEach(key => {
            if (input[key] === null) {
                input[key] = undefined;
            }
        });
    }

    public abstract getTitle(): string;

    public getListTitle(): string {
        return this.getTitle();
    }

    public toString(): string {
        return this.getTitle();
    }

    /**
     * returns the collectionString.
     *
     * The server and the dataStore use it to identify the collection.
     */
    public get collectionString(): string {
        return this._collectionString;
    }

    /**
     * Most simple and most commonly used deserialize function.
     * Inherited to children, can be overwritten for special use cases
     * @param input JSON data for deserialization.
     */
    public deserialize(input: any): void {
        Object.assign(this, input);
    }
}
