import { Motion } from '../../../shared/models/motions/motion';
import { Category } from '../../../shared/models/motions/category';
import { User } from '../../../shared/models/users/user';
import { Workflow } from '../../../shared/models/motions/workflow';
import { WorkflowState } from '../../../shared/models/motions/workflow-state';
import { BaseModel } from '../../../shared/models/base/base-model';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewMotionCommentSection } from './view-motion-comment-section';
import { MotionComment } from '../../../shared/models/motions/motion-comment';
import { Item } from 'app/shared/models/agenda/item';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';

export enum LineNumberingMode {
    None,
    Inside,
    Outside
}

export enum ChangeRecoMode {
    Original,
    Changed,
    Diff,
    Final
}

/**
 * Motion class for the View
 *
 * Stores a motion including all (implicit) references
 * Provides "safe" access to variables and functions in {@link Motion}
 * @ignore
 */
export class ViewMotion extends BaseViewModel {
    protected _motion: Motion;
    protected _category: Category;
    protected _submitters: User[];
    protected _supporters: User[];
    protected _workflow: Workflow;
    protected _state: WorkflowState;
    protected _item: Item;
    protected _block: MotionBlock;
    protected _attachments: Mediafile[];

    /**
     * Indicates the LineNumberingMode Mode.
     * Needs to be accessed from outside
     */
    public lnMode: LineNumberingMode;

    /**
     * Indicates the Change reco Mode.
     * Needs to be accessed from outside
     */
    public crMode: ChangeRecoMode;

    /**
     * Indicates the maximum line length as defined in the configuration.
     * Needs to be accessed from outside
     */
    public lineLength: number;

    /**
     * Indicates the currently highlighted line, if any.
     * Needs to be accessed from outside
     */
    public highlightedLine: number;

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
        return this.item ? this.item.speakerAmount : null;
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
        return this.motion ? this.motion.attachments_id : null
    }

    public get attachments(): Mediafile[] {
        return this._attachments ? this._attachments : null;
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

        // TODO: Should be set using a a config variable
        /*this._configService.get('motions_default_line_numbering').subscribe(
            (mode: string): void => {
                this.lnMode = LineNumberingMode.Outside;
            }
        );*/
        this.lnMode = LineNumberingMode.Outside;
        this.crMode = ChangeRecoMode.Original;
        this.lineLength = 80;

        this.highlightedLine = null;
    }

    public getTitle(): string {
        if (this.identifier) {
            return this.identifier + ' - ' + this.title;
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
     * @param workflow potentially the changed workflow (state). Needs manual verification
     */
    public updateWorkflow(workflow: Workflow): void {
        if (this.motion && workflow.id === this.motion.workflow_id) {
            this._workflow = workflow;
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

    public hasSupporters(): boolean {
        return !!(this.supporters && this.supporters.length > 0);
    }

    public hasAttachments(): boolean {
        return !!(this.attachments && this.attachments.length > 0);
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
            this._attachments
        );
    }
}
