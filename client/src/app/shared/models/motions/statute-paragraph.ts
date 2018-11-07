import { BaseModel } from '../base/base-model';
import { Searchable } from '../base/searchable';
import { SearchRepresentation } from '../../../core/services/search.service';

/**
 * Representation of a statute paragraph.
 * @ignore
 */
export class StatuteParagraph extends BaseModel<StatuteParagraph> implements Searchable {
    public id: number;
    public title: string;
    public text: string;
    public weight: number;

    public constructor(input?: any) {
        super('motions/statute-paragraph', 'Statute paragraph', input);
    }

    public getTitle(): string {
        return this.title;
    }

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        return [this.title, this.text];
    }

    /**
     * TODO: add an id as url parameter, so the statute paragraph auto-opens.
     */
    public getDetailStateURL(): string {
        return '/motions/statute-paragraphs';
    }
}
