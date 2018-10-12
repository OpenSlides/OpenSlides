import { BaseViewModel } from '../../base/base-view-model';
import { Group } from '../../../shared/models/users/group';
import { BaseModel } from '../../../shared/models/base/base-model';
import { StatuteParagraph } from '../../../shared/models/motions/statute-paragraph';

/**
 * State paragrpah class for the View
 *
 * Stores a statute paragraph including all (implicit) references
 * Provides "safe" access to variables and functions in {@link StatuteParagraph}
 * @ignore
 */
export class ViewStatuteParagraph extends BaseViewModel {
    private _paragraph: StatuteParagraph;

    public get statuteParagraph(): StatuteParagraph {
        return this._paragraph;
    }

    public get id(): number {
        return this.statuteParagraph ? this.statuteParagraph.id : null;
    }

    public get title(): string {
        return this.statuteParagraph ? this.statuteParagraph.title : null;
    }

    public get text(): string {
        return this.statuteParagraph ? this.statuteParagraph.text : null;
    }

    public get weight(): number {
        return this.statuteParagraph ? this.statuteParagraph.weight : null;
    }

    public constructor(paragraph: StatuteParagraph) {
        super();
        this._paragraph = paragraph;
    }

    public getTitle(): string {
        return this.title;
    }

    /**
     * Updates the local objects if required
     * @param section
     */
    public updateValues(paragraph: BaseModel): void {
        if (paragraph instanceof StatuteParagraph) {
            this._paragraph = paragraph as StatuteParagraph;
        }
    }

    // TODO: Implement updating of groups
    public updateGroup(group: Group): void {
        console.log(this._paragraph, group);
    }

    /**
     * Duplicate this motion into a copy of itself
     */
    public copy(): ViewStatuteParagraph {
        return new ViewStatuteParagraph(this._paragraph);
    }
}
