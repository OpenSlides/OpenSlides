import { BaseModel } from '../base.model';

/**
 * Representation of a config variable
 * @ignore
 */
export class Config extends BaseModel {
    protected _collectionString: string;
    id: number;
    key: string;
    value: Object;

    constructor(id?: number, key?: string, value?: Object) {
        super();
        this._collectionString = 'core/config';
        this.id = id;
        this.key = key;
        this.value = value;
    }
}

BaseModel.registerCollectionElement('core/config', Config);
