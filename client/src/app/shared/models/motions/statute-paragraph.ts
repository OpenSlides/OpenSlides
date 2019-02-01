import { BaseModel } from '../base/base-model';

/**
 * Representation of a statute paragraph.
 * @ignore
 */
export class StatuteParagraph extends BaseModel<StatuteParagraph> {
    public static COLLECTIONSTRING = 'motions/statute-paragraph';

    public id: number;
    public title: string;
    public text: string;
    public weight: number;

    public constructor(input?: any) {
        super(StatuteParagraph.COLLECTIONSTRING, input);
    }
}
