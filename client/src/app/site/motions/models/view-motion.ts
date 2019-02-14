import { MotionComment } from 'app/shared/models/motions/motion-comment';
import { Motion } from 'app/shared/models/motions/motion';
import { PersonalNoteContent } from 'app/shared/models/users/personal-note';
import { ViewMotionCommentSection } from './view-motion-comment-section';
import { WorkflowState } from 'app/shared/models/motions/workflow-state';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { BaseAgendaViewModel } from 'app/site/base/base-agenda-view-model';
import { Searchable } from 'app/site/base/searchable';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewWorkflow } from './view-workflow';
import { ViewCategory } from './view-category';
import { ViewMotionBlock } from './view-motion-block';
import { BaseViewModel } from 'app/site/base/base-view-model';

/**
 * The line numbering mode for the motion detail view.
 * The constants need to be in sync with the values saved in the config store.
 */
export enum LineNumberingMode {
    None = 'none',
    Inside = 'inline',
    Outside = 'outside'
}

/**
 * The change recommendation mode for the motion detail view.
 */
export enum ChangeRecoMode {
    Original = 'original',
    Changed = 'changed',
    Diff = 'diff',
    Final = 'agreed',
    ModifiedFinal = 'modified_final_version'
}

/**
 * Motion class for the View
 *
 * Stores a motion including all (implicit) references
 * Provides "safe" access to variables and functions in {@link Motion}
 * @ignore
 */
export class ViewMotion extends BaseAgendaViewModel implements Searchable {
    public static COLLECTIONSTRING = Motion.COLLECTIONSTRING;

    protected _motion: Motion;
    protected _category: ViewCategory;
    protected _submitters: ViewUser[];
    protected _supporters: ViewUser[];
    protected _workflow: ViewWorkflow;
    protected _state: WorkflowState;
    protected _item: ViewItem;
    protected _block: ViewMotionBlock;
    protected _attachments: ViewMediafile[];
    protected _tags: ViewTag[];
    protected _parent: ViewMotion;
    public personalNote: PersonalNoteContent;

    /**
     * Is set by the repository; this is the order of the flat call list given by
     * the properties weight and sort_parent_id
     */
    public callListWeight: number;

    public get motion(): Motion {
        return this._motion;
    }

    public get id(): number {
        return this.motion.id;
    }

    public get identifier(): string {
        return this.motion.identifier;
    }

    public get title(): string {
        return this.motion.title;
    }

    public get identifierOrTitle(): string {
        return this.identifier ? this.identifier : this.title;
    }

    public get text(): string {
        return this.motion.text;
    }

    public get reason(): string {
        return this.motion.reason;
    }

    public get modified_final_version(): string {
        return this.motion.modified_final_version;
    }

    public set modified_final_version(value: string) {
        if (this.motion) {
            this.motion.modified_final_version = value;
        }
    }

    public get weight(): number {
        return this.motion.weight;
    }

    public get sort_parent_id(): number {
        return this.motion.sort_parent_id;
    }

    public get agenda_item_id(): number {
        return this.motion.agenda_item_id;
    }

    public get category_id(): number {
        return this.motion.category_id;
    }

    public get category(): ViewCategory {
        return this._category;
    }

    public get submitters(): ViewUser[] {
        return this._submitters;
    }

    public get submitters_id(): number[] {
        return this.motion.submitters_id;
    }

    public get supporters(): ViewUser[] {
        return this._supporters;
    }

    public get supporters_id(): number[] {
        return this.motion.supporters_id;
    }

    public set supporters(users: ViewUser[]) {
        this._supporters = users;
        this._motion.supporters_id = users.map(user => user.id);
    }

    public get workflow(): ViewWorkflow {
        return this._workflow;
    }

    public get workflow_id(): number {
        return this.motion.workflow_id;
    }

    public get state(): WorkflowState {
        return this._state;
    }

    /**
     * Checks if the current state of thw workflow is final
     *
     * @returns true if it is final
     */
    public get isFinalState(): boolean {
        return this._state.isFinalState;
    }

    public get state_id(): number {
        return this.motion.state_id;
    }

    public get recommendation_id(): number {
        return this.motion.recommendation_id;
    }

    public get statute_paragraph_id(): number {
        return this.motion.statute_paragraph_id;
    }

    public get recommendation(): WorkflowState {
        return this.workflow ? this.workflow.getStateById(this.recommendation_id) : null;
    }

    public get possibleRecommendations(): WorkflowState[] {
        return this.workflow
            ? this.workflow.states.filter(recommendation => recommendation.recommendation_label !== undefined)
            : null;
    }

    public get origin(): string {
        return this.motion.origin;
    }

    public get nextStates(): WorkflowState[] {
        return this.state && this.workflow ? this.state.getNextStates(this.workflow.workflow) : [];
    }

    public get previousStates(): WorkflowState[] {
        return this.state && this.workflow ? this.state.getPreviousStates(this.workflow.workflow) : [];
    }

    public get item(): ViewItem {
        return this._item;
    }

    public get agenda_type(): number {
        return this.item ? this.item.type : null;
    }

    public get motion_block_id(): number {
        return this.motion.motion_block_id;
    }

    public get motion_block(): ViewMotionBlock {
        return this._block;
    }

    public get agendaSpeakerAmount(): number {
        return this.item ? this.item.waitingSpeakerAmount : null;
    }

    public get parent_id(): number {
        return this.motion.parent_id;
    }

    public get amendment_paragraphs(): string[] {
        return this.motion.amendment_paragraphs ? this.motion.amendment_paragraphs : [];
    }

    public get tags_id(): number[] {
        return this.motion.tags_id;
    }

    public get attachments_id(): number[] {
        return this.motion.attachments_id;
    }

    public get attachments(): ViewMediafile[] {
        return this._attachments;
    }

    public get tags(): ViewTag[] {
        return this._tags;
    }

    public get parent(): ViewMotion {
        return this._parent;
    }

    /**
     * @returns the creation date as Date object
     */
    public get creationDate(): Date {
        if (!this.motion.created) {
            return null;
        }
        return new Date(this.motion.created);
    }

    /**
     * @returns the date of the last change as Date object, null if empty
     */
    public get lastChangeDate(): Date {
        if (!this.motion.last_modified) {
            return null;
        }
        return new Date(this.motion.last_modified);
    }

    /**
     * @returns the current state extension if the workwlof allows for extenstion fields
     */
    public get stateExtension(): string {
        if (this.state && this.state.show_state_extension_field) {
            return this.motion.state_extension;
        } else {
            return null;
        }
    }

    /**
     * @returns the current recommendation extension if the workwlof allows for extenstion fields
     */
    public get recommendationExtension(): string {
        if (this.recommendation && this.recommendation.show_recommendation_extension_field) {
            return this.motion.recommendation_extension;
        } else {
            return null;
        }
    }

    /**
     * Gets the comments' section ids of a motion. Used in filter by motionComment
     *
     * @returns an array of ids, or an empty array
     */
    public get commentSectionIds(): number[] {
        if (!this.motion) {
            return [];
        }
        return this.motion.comments.map(comment => comment.section_id);
    }

    /**
     * Getter to query the 'favorite'/'star' status of the motions
     *
     * @returns the current state
     */
    public get star(): boolean {
        return this.personalNote && this.personalNote.star ? true : false;
    }

    /**
     * Queries if any personal comments are rpesent
     *
     * @returns true if personalContent is present and has notes
     */
    public get hasNotes(): boolean {
        return this.personalNote && this.personalNote.note ? true : false;
    }

    /**
     * This is set by the repository
     */
    public getAgendaTitle;

    /**
     * This is set by the repository
     */
    public getAgendaTitleWithType;

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(
        motion: Motion,
        category?: ViewCategory,
        submitters?: ViewUser[],
        supporters?: ViewUser[],
        workflow?: ViewWorkflow,
        state?: WorkflowState,
        item?: ViewItem,
        block?: ViewMotionBlock,
        attachments?: ViewMediafile[],
        tags?: ViewTag[],
        parent?: ViewMotion
    ) {
        super(Motion.COLLECTIONSTRING);
        this._motion = motion;
        this._category = category;
        this._submitters = submitters;
        this._supporters = supporters;
        this._workflow = workflow;
        this._state = state;
        this._item = item;
        this._block = block;
        this._attachments = attachments;
        this._tags = tags;
        this._parent = parent;
    }

    public getTitle = () => {
        if (this.identifier) {
            return this.identifier + ': ' + this.title;
        } else {
            return this.title;
        }
    };

    public getAgendaItem(): ViewItem {
        return this.item;
    }

    /**
     * Formats the category for search
     *
     * TODO!!!!
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        let searchValues = [this.title, this.text, this.reason];
        if (this.amendment_paragraphs) {
            searchValues = searchValues.concat(this.amendment_paragraphs.filter(x => !!x));
        }
        return searchValues;
    }

    public getDetailStateURL(): string {
        return `/motions/${this.id}`;
    }

    /**
     * Returns the motion comment for the given section. Null, if no comment exist.
     *
     * @param section The section to search the comment for.
     */
    public getCommentForSection(section: ViewMotionCommentSection): MotionComment {
        if (!this.motion) {
            return null;
        }
        return this.motion.comments.find(comment => comment.section_id === section.id);
    }

    /**
     * Updates the local objects if required
     *
     * @param update
     */
    public updateDependencies(update: BaseViewModel): void {
        if (update instanceof ViewWorkflow) {
            this.updateWorkflow(update);
        } else if (update instanceof ViewCategory) {
            this.updateCategory(update);
        } else if (update instanceof ViewItem) {
            this.updateItem(update);
        } else if (update instanceof ViewMotionBlock) {
            this.updateMotionBlock(update);
        } else if (update instanceof ViewUser) {
            this.updateUser(update);
        } else if (update instanceof ViewMediafile) {
            this.updateAttachments(update);
        } else if (update instanceof ViewTag) {
            this.updateTags(update);
        } else if (update instanceof ViewMotion && update.id !== this.id) {
            this.updateParent(update);
        }
    }

    /**
     * Update routine for the workflow
     *
     * @param workflow potentially the (changed workflow (state). Needs manual verification
     */
    public updateWorkflow(workflow: ViewWorkflow): void {
        if (workflow.id === this.motion.workflow_id) {
            this._workflow = workflow;
            this._state = workflow.getStateById(this.state_id);
        }
    }

    /**
     * Update routine for the category
     *
     * @param category potentially the changed category. Needs manual verification
     */
    public updateCategory(category: ViewCategory): void {
        if (this.category_id && category.id === this.motion.category_id) {
            this._category = category;
        }
    }

    /**
     * Update routine for the agenda Item
     *
     * @param item potentially the changed agenda Item. Needs manual verification
     */
    public updateItem(item: ViewItem): void {
        if (item.id === this.motion.agenda_item_id) {
            this._item = item;
        }
    }

    /**
     * Update routine for the motion block
     *
     * @param block potentially the changed motion block. Needs manual verification
     */
    public updateMotionBlock(block: ViewMotionBlock): void {
        if (this.motion_block_id && block.id === this.motion.motion_block_id) {
            this._block = block;
        }
    }

    /**
     * Update routine for supporters and submitters
     *
     * @param update potentially the changed agenda Item. Needs manual verification
     */
    public updateUser(update: ViewUser): void {
        if (this.motion.submitters && this.motion.submitters.find(user => user.user_id === update.id)) {
            const userIndex = this.motion.submitters.findIndex(submitter => submitter.user_id === update.id);
            this.submitters[userIndex] = update;
        }
        if (this.motion.supporters_id && this.motion.supporters_id.includes(update.id)) {
            const userIndex = this.supporters.findIndex(user => user.id === update.id);
            if (userIndex < 0) {
                this.supporters.push(update);
            } else {
                this.supporters[userIndex] = update;
            }
        }
    }

    /**
     * Update routine for attachments
     *
     * @param mediafile
     */
    public updateAttachments(mediafile: ViewMediafile): void {
        if (this.attachments_id && this.attachments_id.includes(mediafile.id)) {
            const attachmentIndex = this.attachments.findIndex(_mediafile => _mediafile.id === mediafile.id);
            if (attachmentIndex < 0) {
                this.attachments.push(mediafile);
            } else {
                this.attachments[attachmentIndex] = mediafile;
            }
        }
    }

    public updateTags(tag: ViewTag): void {
        if (this.tags_id && this.tags_id.includes(tag.id)) {
            const tagIndex = this.tags.findIndex(_tag => _tag.id === tag.id);
            if (tagIndex < 0) {
                this.tags.push(tag);
            } else {
                this.tags[tagIndex] = tag;
            }
        }
    }

    public updateParent(parent: ViewMotion): void {
        if (this.parent_id && this.parent_id === parent.id) {
            this._parent = parent;
        }
    }

    public hasSupporters(): boolean {
        return !!(this.supporters && this.supporters.length > 0);
    }

    public hasAttachments(): boolean {
        return !!(this.attachments && this.attachments.length > 0);
    }

    public hasTags(): boolean {
        return !!(this.tags && this.tags.length > 0);
    }

    public isStatuteAmendment(): boolean {
        return !!this.statute_paragraph_id;
    }

    /**
     * Determine if the motion is in its final workflow state
     */
    public isInFinalState(): boolean {
        return this.nextStates.length === 0;
    }

    /**
     * It's a paragraph-based amendments if only one paragraph is to be changed,
     * specified by amendment_paragraphs-array
     */
    public isParagraphBasedAmendment(): boolean {
        return this.amendment_paragraphs.length > 0;
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: Motion.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [
                {
                    key: 'mode',
                    displayName: 'Mode',
                    default: 'original',
                    choices: [
                        { value: 'original', displayName: 'Original' },
                        { value: 'changed', displayName: 'Changed' },
                        { value: 'diff', displayName: 'Diff' },
                        { value: 'agreed', displayName: 'Agreed' }
                    ]
                }
            ],
            projectionDefaultName: 'motions',
            getTitle: this.getAgendaTitle
        };
    }

    /**
     * Duplicate this motion into a copy of itself
     */
    public copy(): ViewMotion {
        return new ViewMotion(
            this._motion,
            this._category,
            this._submitters,
            this._supporters,
            this._workflow,
            this._state,
            this._item,
            this._block,
            this._attachments,
            this._tags,
            this._parent
        );
    }
}
