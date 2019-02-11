import { BaseViewModel } from '../../base/base-view-model';
import { StatuteParagraph } from 'app/shared/models/motions/statute-paragraph';
import { Searchable } from 'app/site/base/searchable';
import { SearchRepresentation } from 'app/core/ui-services/search.service';

/**
 * State paragrpah class for the View
 *
 * Stores a statute paragraph including all (implicit) references
 * Provides "safe" access to variables and functions in {@link StatuteParagraph}
 * @ignore
 */
export class ViewStatuteParagraph extends BaseViewModel implements Searchable {
    private _paragraph: StatuteParagraph;

    public get statuteParagraph(): StatuteParagraph {
        return this._paragraph;
    }

    public get id(): number {
        return this.statuteParagraph.id;
    }

    public get title(): string {
        return this.statuteParagraph.title;
    }

    public get text(): string {
        return this.statuteParagraph.text;
    }

    public get weight(): number {
        return this.statuteParagraph.weight;
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(paragraph: StatuteParagraph) {
        super(StatuteParagraph.COLLECTIONSTRING);
        this._paragraph = paragraph;
    }

    public getTitle = () => {
        return this.title;
    };

    public formatForSearch(): SearchRepresentation {
        throw new Error('TODO');
    }

    public getDetailStateURL(): string {
        throw new Error('TODO');
    }

    /**
     * Updates the local objects if required
     * @param section
     */
    public updateDependencies(update: BaseViewModel): void {}

    /**
     * Duplicate this motion into a copy of itself
     */
    public copy(): ViewStatuteParagraph {
        return new ViewStatuteParagraph(this._paragraph);
    }
}
