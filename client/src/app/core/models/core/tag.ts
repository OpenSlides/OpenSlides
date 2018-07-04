import { BaseModel } from 'app/core/models/baseModel';

export class Tag extends BaseModel {
    static collectionString = 'core/tag';
    id: number;
    name: string;

    constructor(id: number, name?: string) {
        super(id);
        this.name = name;
    }

    public getCollectionString(): string {
        return Tag.collectionString;
    }
}
