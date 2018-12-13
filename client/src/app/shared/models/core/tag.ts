import { BaseModel } from '../base/base-model';
import { Searchable } from '../base/searchable';

/**
 * Representation of a tag.
 * @ignore
 */
export class Tag extends BaseModel<Tag> implements Searchable {
    public id: number;
    public name: string;

    public constructor(input?: any) {
        super('core/tag', 'Tag', input);
    }

    public getTitle(): string {
        return this.name;
    }

    public formatForSearch(): string[] {
        return [this.name];
    }

    public getDetailStateURL(): string {
        return '/tags';
    }
}
