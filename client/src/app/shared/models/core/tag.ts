import { BaseModel } from '../base/base-model';

/**
 * Representation of a tag.
 * @ignore
 */
export class Tag extends BaseModel<Tag> {
    public static COLLECTIONSTRING = 'core/tag';

    public id: number;
    public name: string;

    public constructor(input?: any) {
        super(Tag.COLLECTIONSTRING, input);
    }
}
