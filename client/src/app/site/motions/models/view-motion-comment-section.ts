import { MotionCommentSection } from 'app/shared/models/motions/motion-comment-section';
import { ViewGroup } from 'app/site/users/models/view-group';
import { BaseViewModel } from '../../base/base-view-model';

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
export class ViewMotionCommentSection
    extends BaseViewModel<MotionCommentSection>
    implements MotionCommentSectionTitleInformation {
    public static COLLECTIONSTRING = MotionCommentSection.COLLECTIONSTRING;
    protected _collectionString = MotionCommentSection.COLLECTIONSTRING;

    public get section(): MotionCommentSection {
        return this._model;
    }
}

interface IMotionCommentSectionRelations {
    read_groups: ViewGroup[];
    write_groups: ViewGroup[];
}
export interface ViewMotionCommentSection extends MotionCommentSection, IMotionCommentSectionRelations {}
