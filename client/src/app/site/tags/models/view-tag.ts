import { Tag } from 'app/shared/models/core/tag';
import { BaseViewModel } from '../../base/base-view-model';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { Searchable } from 'app/site/base/searchable';

export interface TagTitleInformation {
    name: string;
}

/**
 * Tag view class
 *
 * Stores a Tag including all (implicit) references
 * Provides "safe" access to variables and functions in {@link Tag}
 * @ignore
 */
export class ViewTag extends BaseViewModel<Tag> implements TagTitleInformation, Searchable {
    public static COLLECTIONSTRING = Tag.COLLECTIONSTRING;

    public get tag(): Tag {
        return this._model;
    }

    public get name(): string {
        return this.tag.name;
    }

    public constructor(tag: Tag) {
        super(Tag.COLLECTIONSTRING, tag);
    }

    public formatForSearch(): SearchRepresentation {
        return [this.name];
    }

    public getDetailStateURL(): string {
        return `/tags`;
    }

    /**
     * Updates the local objects if required
     * @param update
     */
    public updateDependencies(update: BaseViewModel): void {}
}
