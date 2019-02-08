import { Tag } from 'app/shared/models/core/tag';
import { BaseViewModel } from '../../base/base-view-model';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { Searchable } from 'app/site/base/searchable';

/**
 * Tag view class
 *
 * Stores a Tag including all (implicit) references
 * Provides "safe" access to variables and functions in {@link Tag}
 * @ignore
 */
export class ViewTag extends BaseViewModel implements Searchable {
    private _tag: Tag;

    public get tag(): Tag {
        return this._tag;
    }

    public get id(): number {
        return this.tag.id;
    }

    public get name(): string {
        return this.tag.name;
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(tag: Tag) {
        super(Tag.COLLECTIONSTRING);
        this._tag = tag;
    }

    public getTitle = () => {
        return this.name;
    };

    public formatForSearch(): SearchRepresentation {
        return [this.name];
    }

    public getDetailStateURL(): string {
        throw new Error('TODO');
    }

    /**
     * Updates the local objects if required
     * @param update
     */
    public updateDependencies(update: BaseViewModel): void {}
}
