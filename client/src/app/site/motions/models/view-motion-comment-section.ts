import { BaseViewModel } from '../../base/base-view-model';
import { MotionCommentSection } from 'app/shared/models/motions/motion-comment-section';
import { ViewGroup } from 'app/site/users/models/view-group';

export interface MotionCommentSectionTitleInformation {
    name: string;
}

/**
 * Motion comment section class for the View
 *
 * Stores a motion comment section including all (implicit) references
 * Provides "safe" access to variables and functions in {@link MotionCommentSection}
 * @ignore
 */
export class ViewMotionCommentSection extends BaseViewModel<MotionCommentSection>
    implements MotionCommentSectionTitleInformation {
    public static COLLECTIONSTRING = MotionCommentSection.COLLECTIONSTRING;

    private _readGroups: ViewGroup[];
    private _writeGroups: ViewGroup[];

    public get section(): MotionCommentSection {
        return this._model;
    }

    public get id(): number {
        return this.section.id;
    }

    public get name(): string {
        return this.section.name;
    }

    public get read_groups_id(): number[] {
        return this.section.read_groups_id;
    }

    public get write_groups_id(): number[] {
        return this.section.write_groups_id;
    }

    public get read_groups(): ViewGroup[] {
        return this._readGroups;
    }

    public get write_groups(): ViewGroup[] {
        return this._writeGroups;
    }

    public get weight(): number {
        return this.section.weight;
    }

    /**
     * TODO: Where is this needed? Try to avoid this.
     */
    public set name(name: string) {
        this._model.name = name;
    }

    public constructor(motionCommentSection: MotionCommentSection, readGroups: ViewGroup[], writeGroups: ViewGroup[]) {
        super(MotionCommentSection.COLLECTIONSTRING, motionCommentSection);
        this._readGroups = readGroups;
        this._writeGroups = writeGroups;
    }

    /**
     * Updates the local objects if required
     * @param section
     */
    public updateDependencies(update: BaseViewModel): void {
        if (update instanceof ViewGroup) {
            if (this.section.read_groups_id.includes(update.id)) {
                const groupIndex = this.read_groups.findIndex(group => group.id === update.id);
                if (groupIndex < 0) {
                    this.read_groups.push(update);
                } else {
                    this.read_groups[groupIndex] = update;
                }
            } else if (this.section.write_groups_id.includes(update.id)) {
                const groupIndex = this.write_groups.findIndex(group => group.id === update.id);
                if (groupIndex < 0) {
                    this.write_groups.push(update);
                } else {
                    this.write_groups[groupIndex] = update;
                }
            }
        }
    }
}
