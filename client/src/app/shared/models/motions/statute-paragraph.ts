import { BaseModel } from '../base/base-model';

/**
 * Representation of a statute paragraph.
 * @ignore
 */
export class StatuteParagraph extends BaseModel<StatuteParagraph> {
    public id: number;
    public title: string;
    public text: string;
    public weight: number;

    public constructor(input?: any) {
        super('motions/statute-paragraph', input);
    }

    public getTitle(): string {
        return this.title;
    }
}
