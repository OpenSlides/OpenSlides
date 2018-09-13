import { BaseModel } from '../base.model';

/**
 * Representation of a tag.
 * @ignore
 */
export class Tag extends BaseModel {
    public id: number;
    public name: string;

    public constructor(input?: any) {
        super('core/tag', input);
    }

    public toString(): string {
        return this.name;
    }
}

BaseModel.registerCollectionElement('core/tag', Tag);
