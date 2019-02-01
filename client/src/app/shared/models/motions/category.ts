import { BaseModel } from '../base/base-model';

/**
 * Representation of a motion category. Has the nested property "File"
 * @ignore
 */
export class Category extends BaseModel<Category> {
    public static COLLECTIONSTRING = 'motions/category';

    public id: number;
    public name: string;
    public prefix: string;

    public constructor(input?: any) {
        super(Category.COLLECTIONSTRING, input);
    }
}
