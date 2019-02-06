import { BaseModel } from 'app/shared/models/base/base-model';
import { BaseProjectableModel } from 'app/site/base/base-projectable-model';
import { Category } from 'app/shared/models/motions/category';
import { MotionComment } from 'app/shared/models/motions/motion-comment';
import { Item } from 'app/shared/models/agenda/item';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { Motion } from 'app/shared/models/motions/motion';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { PersonalNoteContent } from 'app/shared/models/users/personal-note';
import { User } from 'app/shared/models/users/user';
import { ViewMotionCommentSection } from './view-motion-comment-section';
import { Workflow } from 'app/shared/models/motions/workflow';
import { WorkflowState } from 'app/shared/models/motions/workflow-state';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { Tag } from 'app/shared/models/core/tag';

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
export class ViewMotion extends BaseProjectableModel {
    protected _motion: Motion;
    protected _category: Category;
    protected _submitters: User[];
    protected _supporters: User[];
    protected _workflow: Workflow;
    protected _state: WorkflowState;
    protected _item: Item;
    protected _block: MotionBlock;
    protected _attachments: Mediafile[];
    protected _tags: Tag[];
    protected _parent: Motion;
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
        return this.motion ? this.motion.id : null;
    }

    public get identifier(): string {
        return this.motion && this.motion.identifier ? this.motion.identifier : null;
    }

    public get title(): string {
        return this.motion ? this.motion.title : null;
    }

    public get identifierOrTitle(): string {
        if (!this.motion) {
            return null;
        }
        return this.identifier ? this.identifier : this.title;
    }

    public get text(): string {
        return this.motion ? this.motion.text : null;
    }

    public get reason(): string {
        return this.motion ? this.motion.reason : null;
    }

    public get modified_final_version(): string {
        return this.motion ? this.motion.modified_final_version : null;
    }

    public set modified_final_version(value: string) {
        if (this.motion) {
            this.motion.modified_final_version = value;
        }
    }

    public get weight(): number {
        return this.motion ? this.motion.weight : null;
    }

    public get sort_parent_id(): number {
        return this.motion ? this.motion.sort_parent_id : null;
    }

    public get category(): Category {
        return this._category;
    }

    public get agenda_item_id(): number {
        return this.motion ? this.motion.agenda_item_id : null;
    }

    public get category_id(): number {
        return this.motion && this.category ? this.motion.category_id : null;
    }

    public get submitters(): User[] {
        return this._submitters;
    }

    public get submitters_id(): number[] {
        return this.motion ? this.motion.submitterIds : null;
    }

    public get supporters(): User[] {
        return this._supporters;
    }

    public get supporters_id(): number[] {
        return this.motion ? this.motion.supporters_id : null;
    }

    public get workflow(): Workflow {
        return this._workflow;
    }

    public get workflow_id(): number {
        return this.motion ? this.motion.workflow_id : null;
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
        return this.motion && this.motion.state_id ? this.motion.state_id : null;
    }

    public get recommendation_id(): number {
        return this.motion && this.motion.recommendation_id ? this.motion.recommendation_id : null;
    }

    public get statute_paragraph_id(): number {
        return this.motion && this.motion.statute_paragraph_id ? this.motion.statute_paragraph_id : null;
    }

    public get recommendation(): WorkflowState {
        return this.recommendation_id && this.workflow ? this.workflow.getStateById(this.recommendation_id) : null;
    }

    public get possibleRecommendations(): WorkflowState[] {
        return this.workflow
            ? this.workflow.states.filter(recommendation => recommendation.recommendation_label !== undefined)
            : null;
    }

    public get origin(): string {
        return this.motion ? this.motion.origin : null;
    }

    public get nextStates(): WorkflowState[] {
        return this.state && this.workflow ? this.state.getNextStates(this.workflow) : null;
    }

    public set supporters(users: User[]) {
        this._supporters = users;
        this._motion.supporters_id = users.map(user => user.id);
    }

    public get item(): Item {
        return this._item;
    }

    public get agenda_type(): number {
        return this.item ? this.item.type : null;
    }

    public get motion_block_id(): number {
        return this.motion ? this.motion.motion_block_id : null;
    }

    public get motion_block(): MotionBlock {
        return this._block;
    }

    public get agendaSpeakerAmount(): number {
        return this.item ? this.item.waitingSpeakerAmount : null;
    }

    public get parent_id(): number {
        return this.motion && this.motion.parent_id ? this.motion.parent_id : null;
    }

    public get amendment_paragraphs(): string[] {
        return this.motion && this.motion.amendment_paragraphs ? this.motion.amendment_paragraphs : [];
    }

    public get tags_id(): number[] {
        return this.motion ? this.motion.tags_id : null;
    }

    public get attachments_id(): number[] {
        return this.motion ? this.motion.attachments_id : null;
    }

    public get attachments(): Mediafile[] {
        return this._attachments ? this._attachments : null;
    }

    public get tags(): Tag[] {
        return this._tags ? this._tags : null;
    }

    public get parent(): Motion {
        return this._parent;
    }

    /**
     * @returns the creation date as Date object
     */
    public get creationDate(): Date {
        if (!this.motion || !this.motion.created) {
            return null;
        }
        return new Date(this.motion.created);
    }

    /**
     * @returns the date of the last change as Date object, null if empty
     */
    public get lastChangeDate(): Date {
        if (!this.motion || !this.motion.last_modified) {
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

    public constructor(
        motion?: Motion,
        category?: Category,
        submitters?: User[],
        supporters?: User[],
        workflow?: Workflow,
        state?: WorkflowState,
        item?: Item,
        block?: MotionBlock,
        attachments?: Mediafile[],
        tags?: Tag[],
        parent?: Motion
    ) {
        super();
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

    public getTitle(): string {
        if (this.identifier) {
            return 'Motion ' + this.identifier;
        }
        return this.title;
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
    public updateValues(update: BaseModel): void {
        if (update instanceof Workflow) {
            this.updateWorkflow(update as Workflow);
        } else if (update instanceof Category) {
            this.updateCategory(update as Category);
        } else if (update instanceof Item) {
            this.updateItem(update as Item);
        } else if (update instanceof MotionBlock) {
            this.updateMotionBlock(update);
        } else if (update instanceof User) {
            this.updateUser(update as User);
        } else if (update instanceof Mediafile) {
            this.updateAttachments(update as Mediafile);
        } else if (update instanceof Tag) {
            this.updateTags(update as Tag);
        } else if (update instanceof Motion && update.id !== this.id) {
            this.updateParent(update as Motion);
        }
    }

    /**
     * Update routine for the category
     *
     * @param category potentially the changed category. Needs manual verification
     */
    public updateCategory(category: Category): void {
        if (this.motion && category.id === this.motion.category_id) {
            this._category = category;
        }
    }

    /**
     * Update routine for the workflow
     *
     * @param workflow potentially the (changed workflow (state). Needs manual verification
     */
    public updateWorkflow(workflow: Workflow): void {
        if (this.motion && workflow.id === this.motion.workflow_id) {
            this._workflow = workflow;
            this._state = workflow.getStateById(this.state_id);
        }
    }

    /**
     * Update routine for the agenda Item
     *
     * @param item potentially the changed agenda Item. Needs manual verification
     */
    public updateItem(item: Item): void {
        if (this.motion && item.id === this.motion.agenda_item_id) {
            this._item = item;
        }
    }

    /**
     * Update routine for the motion block
     *
     * @param block potentially the changed motion block. Needs manual verification
     */
    public updateMotionBlock(block: MotionBlock): void {
        if (this.motion && block.id === this.motion.motion_block_id) {
            this._block = block;
        }
    }

    /**
     * Update routine for supporters and submitters
     *
     * @param update potentially the changed agenda Item. Needs manual verification
     */
    public updateUser(update: User): void {
        if (this.motion) {
            if (this.motion.submitters && this.motion.submitters.findIndex(user => user.user_id === update.id)) {
                const userIndex = this.submitters.findIndex(user => user.id === update.id);
                this.submitters[userIndex] = update as User;
            }
            if (this.motion.supporters_id && this.motion.supporters_id.includes(update.id)) {
                const userIndex = this.supporters.findIndex(user => user.id === update.id);
                this.supporters[userIndex] = update as User;
            }
        }
    }

    /**
     * Update routine for attachments
     *
     * @param update
     */
    public updateAttachments(update: Mediafile): void {
        if (this.motion) {
            if (this.attachments_id && this.attachments_id.includes(update.id)) {
                const attachmentIndex = this.attachments.findIndex(mediafile => mediafile.id === update.id);
                this.attachments[attachmentIndex] = update as Mediafile;
            }
        }
    }

    public updateTags(update: Tag): void {
        if (this.motion) {
            if (this.tags_id && this.tags_id.includes(update.id)) {
                const tagIndex = this.tags.findIndex(tag => tag.id === update.id);
                this.tags[tagIndex] = update as Tag;
            }
        }
    }

    public updateParent(update: Motion): void {
        if (this.motion) {
            if (this.parent_id && this.parent_id === update.id) {
                this._parent = update as Motion;
            }
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
            getBasicProjectorElement: () => ({
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
            getTitle: () => this.identifier
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
