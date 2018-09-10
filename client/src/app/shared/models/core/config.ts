import { BaseModel } from '../base.model';

/**
 * Representation of a config variable
 * @ignore
 */
export class Config extends BaseModel {
    public id: number;
    public key: string;
    public value: Object;

    public constructor(input?: any) {
        super('core/config', input);
    }
}

BaseModel.registerCollectionElement('core/config', Config);
