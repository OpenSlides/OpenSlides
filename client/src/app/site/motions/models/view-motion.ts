import { _ } from 'app/core/translate/translation-marker';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DiffLinesInParagraph } from 'app/core/ui-services/diff.service';
import { SearchProperty, SearchRepresentation } from 'app/core/ui-services/search.service';
import { Motion, MotionComment } from 'app/shared/models/motions/motion';
import { PersonalNoteContent } from 'app/shared/models/users/personal-note';
import { TitleInformationWithAgendaItem } from 'app/site/base/base-view-model-with-agenda-item';
import { BaseViewModelWithAgendaItemAndListOfSpeakers } from 'app/site/base/base-view-model-with-agenda-item-and-list-of-speakers';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { Searchable } from 'app/site/base/searchable';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewCategory } from './view-category';
import { ViewMotionBlock } from './view-motion-block';
import { ViewMotionChangeRecommendation } from './view-motion-change-recommendation';
import { ViewMotionCommentSection } from './view-motion-comment-section';
import { ViewState } from './view-state';
import { ViewSubmitter } from './view-submitter';
import { ViewWorkflow } from './view-workflow';

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

export enum AmendmentType {
    Amendment = 1,
    Parent
}

export const verboseChangeRecoMode = {
    original: 'Original version',
    changed: 'Changed version',
    diff: 'Diff version',
    agreed: 'Final version',
    modified_final_version: 'Final print template'
};

export interface MotionTitleInformation extends TitleInformationWithAgendaItem {
    title: string;
    identifier?: string;
}

/**
 * Motion class for the View
 *
 * Stores a motion including all (implicit) references
 * Provides "safe" access to variables and functions in {@link Motion}
 * @ignore
 */
export class ViewMotion extends BaseViewModelWithAgendaItemAndListOfSpeakers<Motion>
    implements MotionTitleInformation, Searchable {
    public get motion(): Motion {
        return this._model;
    }

    public get category(): ViewCategory | null {
        return this._category;
    }

    public get state(): ViewState | null {
        return this._state;
    }

    public get recommendation(): ViewState | null {
        return this._recommendation;
    }

    public get submitters(): ViewSubmitter[] {
        return this._submitters || [];
    }

    public get submittersAsUsers(): ViewUser[] {
        return this.submitters.map(submitter => submitter.user);
    }

    public get supporters(): ViewUser[] {
        return this._supporters || [];
    }

    /**
     * TODO: Where is this needed. Try to avoid this..
     */
    public set supporters(users: ViewUser[]) {
        this._supporters = users;
        this._model.supporters_id = users.map(user => user.id);
    }

    public get motion_block(): ViewMotionBlock | null {
        return this._motion_block;
    }

    public get attachments(): ViewMediafile[] {
        return this._attachments || [];
    }

    public get tags(): ViewTag[] {
        return this._tags || [];
    }

    public get parent(): ViewMotion | null {
        return this._parent;
    }

    public get amendments(): ViewMotion[] {
        return this._amendments || [];
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

    public get category_id(): number {
        return this.motion.category_id;
    }

    public get category_weight(): number {
        return this.motion.category_weight;
    }

    public get sorted_submitters_id(): number[] {
        return this.motion.sorted_submitters_id;
    }

    public get supporters_id(): number[] {
        return this.motion.supporters_id;
    }

    public get workflow(): ViewWorkflow {
        return this._workflow;
    }

    public get workflow_id(): number {
        return this.motion.workflow_id;
    }

    public get changeRecommendations(): ViewMotionChangeRecommendation[] {
        return this._changeRecommendations;
    }

    public get change_recommendations_id(): number[] {
        return this.motion.change_recommendations_id;
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

    public get possibleRecommendations(): ViewState[] {
        return this.workflow ? this.workflow.states.filter(state => state.recommendation_label !== undefined) : null;
    }

    public get origin(): string {
        return this.motion.origin;
    }

    public get agenda_type(): number {
        return this.agendaItem ? this.agendaItem.type : null;
    }

    public get motion_block_id(): number {
        return this.motion.motion_block_id;
    }

    public get speakerAmount(): number {
        return this.listOfSpeakers ? this.listOfSpeakers.waitingSpeakerAmount : null;
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
     * @returns the current recommendation extension if the workflow allows for extenstion fields
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
     * @returns the text of a personal note
     */
    public get personalNoteText(): string {
        return this.personalNote.note;
    }

    /**
     * Getter to query the 'favorite'/'star' status of the motions
     */
    public get star(): boolean {
        return !!this.personalNote && !!this.personalNote.star;
    }

    /**
     * Queries if any personal comments are rpesent
     *
     * @returns true if personalContent is present and has notes
     */
    public get hasNotes(): boolean {
        return !!this.personalNote && !!this.personalNote.note;
    }

    public get hasSpeakers(): boolean {
        return this.speakerAmount > 0;
    }

    /**
     * Translate the state's css class into a color
     *
     * @returns a string representing a color
     */
    public get stateCssColor(): string {
        return this.state ? this.state.css_class : '';
    }

    /**
     * getter to access diff lines
     */
    public get diffLines(): DiffLinesInParagraph[] {
        if (!this.parent_id) {
            throw new Error('No parent No diff');
        }
        return this._diffLines;
    }

    public set diffLines(value: DiffLinesInParagraph[]) {
        this._diffLines = value;
    }

    /**
     * Determine if a motion has a parent at all
     */
    public get hasParent(): boolean {
        return !!this.parent_id;
    }

    /**
     * Determine if a motion has amenments
     */
    public get hasAmendments(): boolean {
        return !!this.amendments && !!this.amendments.length;
    }

    /**
     * Determine if the motion has parents, is a parent of neither
     */
    public get amendmentType(): number {
        if (this.hasAmendments) {
            return AmendmentType.Parent;
        } else if (this.hasParent) {
            return AmendmentType.Amendment;
        } else {
            // not any amendment
            return 0;
        }
    }

    /**
     * Get the number of the first diff line, in case a motion is an amendment
     */
    public get parentAndLineNumber(): string | null {
        if (this.isParagraphBasedAmendment() && this.parent && this.diffLines && this.diffLines.length) {
            return `${this.parent.identifier} ${this.diffLines[0].diffLineFrom}`;
        } else {
            return null;
        }
    }
    public static COLLECTIONSTRING = Motion.COLLECTIONSTRING;
    protected _collectionString = Motion.COLLECTIONSTRING;

    protected _category?: ViewCategory;
    protected _submitters?: ViewSubmitter[];
    protected _supporters?: ViewUser[];
    protected _workflow?: ViewWorkflow;
    protected _state?: ViewState;
    protected _recommendation?: ViewState;
    protected _motion_block?: ViewMotionBlock;
    protected _attachments?: ViewMediafile[];
    protected _tags?: ViewTag[];
    protected _parent?: ViewMotion;
    protected _amendments?: ViewMotion[];
    protected _changeRecommendations?: ViewMotionChangeRecommendation[];
    protected _diffLines?: DiffLinesInParagraph[];
    public personalNote?: PersonalNoteContent;

    // This is set by the repository
    public getIdentifierOrTitle: () => string;

    /**
     * Extract the lines of the amendments
     * If an amendments has multiple changes, they will be printed like an array of strings
     *
     * @param amendment the motion to create the amendment to
     * @return The lines of the amendment
     */
    public getChangeLines(): string {
        if (!!this.diffLines) {
            return this.diffLines
                .map(diffLine => {
                    if (diffLine.diffLineTo === diffLine.diffLineFrom + 1) {
                        return '' + diffLine.diffLineFrom;
                    } else {
                        return `${diffLine.diffLineFrom} - ${diffLine.diffLineTo - 1}`;
                    }
                })
                .toString();
        }
    }

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        const properties: SearchProperty[] = [];
        properties.push({ key: 'Title', value: this.getTitle() });
        properties.push({ key: 'Submitters', value: this.submittersAsUsers.map(user => user.full_name).join(', ') });
        properties.push({ key: 'Text', value: this.text, trusted: true });
        properties.push({ key: 'Reason', value: this.reason, trusted: true });
        if (this.amendment_paragraphs) {
            properties.push({
                key: 'Amendments',
                value: this.amendment_paragraphs.filter(x => !!x).join('\n'),
                trusted: true
            });
        }
        properties.push({ key: 'Tags', value: this.tags.map(tag => tag.getTitle()).join(', ') });
        properties.push({
            key: 'Comments',
            value: this.motion.comments.map(comment => comment.comment).join('\n'),
            trusted: true
        });
        properties.push({ key: 'Supporters', value: this.supporters.map(user => user.full_name).join(', ') });

        // A property with block-value to unify the meta-info.
        const metaData: SearchProperty = {
            key: null,
            value: null,
            blockProperties: []
        };
        if (this.motion_block) {
            metaData.blockProperties.push({ key: 'Motion block', value: this.motion_block.getTitle() });
        }
        if (this.category) {
            metaData.blockProperties.push({ key: 'Category', value: this.category.getTitle() });
        }
        if (this.state) {
            metaData.blockProperties.push({ key: 'State', value: this.state.name });
        }

        properties.push(metaData);

        return {
            properties,
            searchValue: properties.map(property =>
                property.key ? property.value : property.blockProperties.join(',')
            )
        };
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
        return this.state ? this.state.isFinalState : false;
    }

    /**
     * It's a paragraph-based amendments if only one paragraph is to be changed,
     * specified by amendment_paragraphs-array
     */
    public isParagraphBasedAmendment(): boolean {
        return this.amendment_paragraphs.length > 0;
    }

    public getSlide(configService: ConfigService): ProjectorElementBuildDeskriptor {
        const slideOptions = [];
        if (
            (this.changeRecommendations && this.changeRecommendations.length) ||
            (this.amendments && this.amendments.length)
        ) {
            slideOptions.push({
                key: 'mode',
                displayName: _('Which version?'),
                default: configService.instant('motions_recommendation_text_mode'),
                choices: [
                    { value: 'original', displayName: 'Original version' },
                    { value: 'changed', displayName: 'Changed version' },
                    { value: 'diff', displayName: 'Diff version' },
                    { value: 'agreed', displayName: 'Final version' }
                ]
            });
        }

        return {
            getBasicProjectorElement: options => ({
                name: Motion.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: slideOptions,
            projectionDefaultName: 'motions',
            getDialogTitle: this.getAgendaSlideTitle
        };
    }

    /**
     * Duplicate this motion into a copy of itself
     */
    public copy(): ViewMotion {
        return new ViewMotion(this._model);
    }
}
