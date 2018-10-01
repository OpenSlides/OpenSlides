import { TranslateService } from '@ngx-translate/core';
import { BaseViewModel } from '../../base/base-view-model';
import { MotionCommentSection } from '../../../shared/models/motions/motion-comment-section';
import { Group } from '../../../shared/models/users/group';
import { BaseModel } from '../../../shared/models/base/base-model';

/**
 * Motion comment section class for the View
 *
 * Stores a motion comment section including all (implicit) references
 * Provides "safe" access to variables and functions in {@link MotionCommentSection}
 * @ignore
 */
export class ViewMotionCommentSection extends BaseViewModel {
    private _section: MotionCommentSection;

    private _read_groups: Group[];
    private _write_groups: Group[];

    public edit = false;
    public open = false;

    public get section(): MotionCommentSection {
        return this._section;
    }

    public get id(): number {
        return this.section ? this.section.id : null;
    }

    public get name(): string {
        return this.section ? this.section.name : null;
    }

    public get read_groups_id(): number[] {
        return this.section ? this.section.read_groups_id : [];
    }

    public get write_groups_id(): number[] {
        return this.section ? this.section.write_groups_id : [];
    }

    public get read_groups(): Group[] {
        return this._read_groups;
    }

    public get write_groups(): Group[] {
        return this._write_groups;
    }

    public set name(name: string) {
        this._section.name = name;
    }

    public constructor(section: MotionCommentSection, read_groups: Group[], write_groups: Group[]) {
        super();
        this._section = section;
        this._read_groups = read_groups;
        this._write_groups = write_groups;
    }

    public getTitle(translate?: TranslateService): string {
        return this.name;
    }

    /**
     * Updates the local objects if required
     * @param section
     */
    public updateValues(update: BaseModel): void {
        if (update instanceof MotionCommentSection) {
            this._section = update as MotionCommentSection;
        }
        if (update instanceof Group) {
            this.updateGroup(update as Group);
        }
    }

    // TODO: Implement updating of groups
    public updateGroup(group: Group): void {
        console.log(this._section, group);
    }

    /**
     * Duplicate this motion into a copy of itself
     */
    public copy(): ViewMotionCommentSection {
        return new ViewMotionCommentSection(this._section, this._read_groups, this._write_groups);
    }
}
