import { Deserializable } from '../deserializable.model';

/**
 * Representation of the content object in agenda item
 * @ignore
 */
export class ContentObject implements Deserializable {
    /**
     * Is the same with dataStores collectionString
     */
    public collection: string;
    public id: number;

    /**
     * Needs to be completely optional because agenda has (yet) the optional parameter 'speaker'
     * @param collection
     * @param id
     */
    public constructor(collection?: string, id?: number) {
        this.collection = collection;
        this.id = id;
    }

    public deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}
