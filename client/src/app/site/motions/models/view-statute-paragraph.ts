import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { StatuteParagraph } from 'app/shared/models/motions/statute-paragraph';
import { Searchable } from 'app/site/base/searchable';
import { BaseViewModel } from '../../base/base-view-model';

export interface StatuteParagraphTitleInformation {
    title: string;
}

/**
 * State paragrpah class for the View
 *
 * Stores a statute paragraph including all (implicit) references
 * Provides "safe" access to variables and functions in {@link StatuteParagraph}
 * @ignore
 */
export class ViewStatuteParagraph
    extends BaseViewModel<StatuteParagraph>
    implements StatuteParagraphTitleInformation, Searchable {
    public static COLLECTIONSTRING = StatuteParagraph.COLLECTIONSTRING;
    protected _collectionString = StatuteParagraph.COLLECTIONSTRING;

    public get statuteParagraph(): StatuteParagraph {
        return this._model;
    }

    public formatForSearch(): SearchRepresentation {
        return { properties: [{ key: 'Title', value: this.getTitle() }], searchValue: [this.getTitle()] };
    }

    public getDetailStateURL(): string {
        return '/motions/statute-paragraphs';
    }
}
export interface ViewStatuteParagraph extends StatuteParagraph {}
