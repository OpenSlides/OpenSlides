import { BaseViewModel } from '../../base/base-view-model';
import { MotionCommentSection } from 'app/shared/models/motions/motion-comment-section';
import { ViewGroup } from 'app/site/users/models/view-group';

/**
 * Motion comment section class for the View
 *
 * Stores a motion comment section including all (implicit) references
 * Provides "safe" access to variables and functions in {@link MotionCommentSection}
 * @ignore
 */
export class ViewMotionCommentSection extends BaseViewModel {
    private _section: MotionCommentSection;

    private _readGroups: ViewGroup[];
    private _writeGroups: ViewGroup[];

    public get section(): MotionCommentSection {
        return this._section;
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

    public set name(name: string) {
        this._section.name = name;
    }

    public constructor(section: MotionCommentSection, readGroups: ViewGroup[], writeGroups: ViewGroup[]) {
        super('Comment section');
        this._section = section;
        this._readGroups = readGroups;
        this._writeGroups = writeGroups;
    }

    public getTitle(): string {
        return this.name;
    }

    /**
     * Updates the local objects if required
     * @param section
     */
    public updateDependencies(update: BaseViewModel): void {
        if (update instanceof ViewGroup) {
            this.updateGroup(update);
        }
    }

    // TODO: Implement updating of groups
    public updateGroup(group: ViewGroup): void {
        console.log('implement update group of motion comment section');
    }

    /**
     * Duplicate this motion into a copy of itself
     */
    public copy(): ViewMotionCommentSection {
        return new ViewMotionCommentSection(this._section, this._readGroups, this._writeGroups);
    }
}
