import { BaseModel } from '../base/base-model';

/**
 * Representation of a config variable
 * @ignore
 */
export class Config extends BaseModel {
    public static COLLECTIONSTRING = 'core/config';
    public id: number;
    public key: string;
    public value: Object;

    public constructor(input?: any) {
        super(Config.COLLECTIONSTRING, input);
    }
}
