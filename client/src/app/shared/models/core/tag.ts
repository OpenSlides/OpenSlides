import { BaseModel } from '../base.model';

/**
 * Representation of a tag.
 * @ignore
 */
export class Tag extends BaseModel {
    protected _collectionString: string;
    id: number;
    name: string;

    constructor(id?: number, name?: string) {
        super();
        this._collectionString = 'core/tag';
        this.id = id;
        this.name = name;
    }
}

BaseModel.registerCollectionElement('core/tag', Tag);
