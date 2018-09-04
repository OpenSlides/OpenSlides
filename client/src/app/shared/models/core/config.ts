import { BaseModel } from '../base.model';

/**
 * Representation of a config variable
 * @ignore
 */
export class Config extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public key: string;
    public value: Object;

    public constructor(input?: any) {
        super();
        this._collectionString = 'core/config';
        if (input) {
            this.deserialize(input);
        }
    }
}

BaseModel.registerCollectionElement('core/config', Config);
