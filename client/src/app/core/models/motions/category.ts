import { BaseModel } from 'app/core/models/baseModel';

export class Category extends BaseModel {
    static collectionString = 'motions/category';
    id: number;
    name: string;
    prefix: string;

    constructor(id: number, name?: string, prefix?: string) {
        super(id);
        this.name = name;
        this.prefix = prefix;
    }

    public getCollectionString(): string {
        return Category.collectionString;
    }
}
