import { BaseModel } from '../base/base-model';

/**
 * Representation of a tag.
 * @ignore
 */
export class Tag extends BaseModel<Tag> {
    public id: number;
    public name: string;

    public constructor(input?: any) {
        super('core/tag', input);
    }

    public getTitle(): string {
        return this.name;
    }
}
