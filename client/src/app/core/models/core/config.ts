import { BaseModel } from 'app/core/models/baseModel';

export class Config extends BaseModel {
    static collectionString = 'core/config';
    id: number;
    key: string;
    value: Object;

    constructor(id: number, key?: string, value?: Object) {
        super(id);
        this.key = key;
        this.value = value;
    }

    public getCollectionString(): string {
        return Config.collectionString;
    }
}
