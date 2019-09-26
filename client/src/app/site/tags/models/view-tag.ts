import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { Tag } from 'app/shared/models/core/tag';
import { Searchable } from 'app/site/base/searchable';
import { BaseViewModel } from '../../base/base-view-model';

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
    protected _collectionString = Tag.COLLECTIONSTRING;

    public get tag(): Tag {
        return this._model;
    }

    public formatForSearch(): SearchRepresentation {
        return { properties: [{ key: 'Name', value: this.name }], searchValue: [this.name] };
    }

    public getDetailStateURL(): string {
        return `/tags`;
    }
}
export interface ViewTag extends Tag {}
