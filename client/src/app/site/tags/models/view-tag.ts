import { Tag } from 'app/shared/models/core/tag';
import { BaseViewModel } from '../../base/base-view-model';

/**
 * Tag view class
 *
 * Stores a Tag including all (implicit) references
 * Provides "safe" access to variables and functions in {@link Tag}
 * @ignore
 */
export class ViewTag extends BaseViewModel {
    private _tag: Tag;

    public constructor(tag: Tag) {
        super();
        this._tag = tag;
    }

    public get tag(): Tag {
        return this._tag;
    }

    public get id(): number {
        return this.tag ? this.tag.id : null;
    }

    public get name(): string {
        return this.tag ? this.tag.name : null;
    }

    public getTitle(): string {
        return this.name;
    }

    /**
     * Updates the local objects if required
     * @param update
     */
    public updateValues(update: Tag): void {
        this._tag = update;
    }
}
