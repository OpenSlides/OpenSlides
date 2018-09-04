import { BaseModel } from '../base.model';

/**
 * Representation of a tag.
 * @ignore
 */
export class Tag extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public name: string;

    public constructor(input?: any) {
        super();
        this._collectionString = 'core/tag';
        if (input) {
            this.deserialize(input);
        }
    }
}

BaseModel.registerCollectionElement('core/tag', Tag);
