import { BaseModel } from '../base/base-model';

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

    public getTitle(): string {
        return this.key;
    }
}

BaseModel.registerCollectionElement('core/config', Config);
