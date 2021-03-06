import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { DataStoreService } from 'app/core/core-services/data-store.service';
import { HttpService } from 'app/core/core-services/http.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DiffLinesInParagraph, DiffService } from 'app/core/ui-services/diff.service';
import { TreeIdNode } from 'app/core/ui-services/tree.service';
import { Motion } from 'app/shared/models/motions/motion';
import { Submitter } from 'app/shared/models/motions/submitter';
import { ViewUnifiedChange, ViewUnifiedChangeType } from 'app/shared/models/motions/view-unified-change';
import { PersonalNoteContent } from 'app/shared/models/users/personal-note';
import { AgendaListTitle } from 'app/site/base/base-view-model-with-agenda-item';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewCategory } from 'app/site/motions/models/view-category';
import { MotionTitleInformation, ViewMotion } from 'app/site/motions/models/view-motion';
import { ViewMotionAmendedParagraph } from 'app/site/motions/models/view-motion-amended-paragraph';
import { ViewMotionBlock } from 'app/site/motions/models/view-motion-block';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-motion-change-recommendation';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { ViewState } from 'app/site/motions/models/view-state';
import { ViewStatuteParagraph } from 'app/site/motions/models/view-statute-paragraph';
import { ViewSubmitter } from 'app/site/motions/models/view-submitter';
import { ViewWorkflow } from 'app/site/motions/models/view-workflow';
import { ChangeRecoMode } from 'app/site/motions/motions.constants';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewPersonalNote } from 'app/site/users/models/view-personal-note';
import { ViewUser } from 'app/site/users/models/view-user';
import { BaseIsAgendaItemAndListOfSpeakersContentObjectRepository } from '../base-is-agenda-item-and-list-of-speakers-content-object-repository';
import { NestedModelDescriptors } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from '../../core-services/data-send.service';
import { LineNumberedString, LinenumberingService, LineNumberRange } from '../../ui-services/linenumbering.service';

type SortProperty = 'weight' | 'identifier';

/**
 * Describes the single paragraphs from the base motion.
 */
export interface ParagraphToChoose {
    /**
     * The paragraph number.
     */
    paragraphNo: number;

    /**
     * The raw HTML of this paragraph.
     */
    html: string;

    /**
     * The first line number
     */
    lineFrom: number;

    /**
     * The last line number
     */
    lineTo: number;
}

const MotionRelations: RelationDefinition[] = [
    {
        type: 'M2O',
        ownIdKey: 'state_id',
        ownKey: 'state',
        foreignViewModel: ViewState
    },
    {
        type: 'M2O',
        ownIdKey: 'recommendation_id',
        ownKey: 'recommendation',
        foreignViewModel: ViewState
    },
    {
        type: 'M2O',
        ownIdKey: 'workflow_id',
        ownKey: 'workflow',
        foreignViewModel: ViewWorkflow
    },
    {
        type: 'M2O',
        ownIdKey: 'category_id',
        ownKey: 'category',
        foreignViewModel: ViewCategory
    },
    {
        type: 'M2O',
        ownIdKey: 'motion_block_id',
        ownKey: 'motion_block',
        foreignViewModel: ViewMotionBlock
    },
    {
        type: 'M2M',
        ownIdKey: 'supporters_id',
        ownKey: 'supporters',
        foreignViewModel: ViewUser
    },
    {
        type: 'M2M',
        ownIdKey: 'attachments_id',
        ownKey: 'attachments',
        foreignViewModel: ViewMediafile
    },
    {
        type: 'M2M',
        ownIdKey: 'tags_id',
        ownKey: 'tags',
        foreignViewModel: ViewTag
    },
    {
        type: 'M2M',
        ownIdKey: 'change_recommendations_id',
        ownKey: 'changeRecommendations',
        foreignViewModel: ViewMotionChangeRecommendation
    },
    {
        type: 'O2M',
        foreignIdKey: 'parent_id',
        ownKey: 'amendments',
        foreignViewModel: ViewMotion
    },
    {
        type: 'M2O',
        ownIdKey: 'parent_id',
        ownKey: 'parent',
        foreignViewModel: ViewMotion
    },
    {
        type: 'O2M',
        foreignIdKey: 'motion_id',
        ownKey: 'polls',
        foreignViewModel: ViewMotionPoll
    }
    // Personal notes are dynamically added in the repo.
];

const MotionNestedModelDescriptors: NestedModelDescriptors = {
    'motions/motion': [
        {
            ownKey: 'submitters',
            foreignViewModel: ViewSubmitter,
            foreignModel: Submitter,
            order: 'weight',
            relationDefinitionsByKey: {
                user: {
                    type: 'M2O',
                    ownIdKey: 'user_id',
                    ownKey: 'user',
                    foreignViewModel: ViewUser
                }
            },
            titles: {
                getTitle: (viewSubmitter: ViewSubmitter) => (viewSubmitter.user ? viewSubmitter.user.getTitle() : '')
            }
        }
    ]
};

/**
 * Repository Services for motions (and potentially categories)
 *
 * The repository is meant to process domain objects (those found under
 * shared/models), so components can display them and interact with them.
 *
 * Rather than manipulating models directly, the repository is meant to
 * inform the {@link DataSendService} about changes which will send
 * them to the Server.
 */
@Injectable({
    providedIn: 'root'
})
export class MotionRepositoryService extends BaseIsAgendaItemAndListOfSpeakersContentObjectRepository<
    ViewMotion,
    Motion,
    MotionTitleInformation
> {
    /**
     * The property the incoming data is sorted by
     */
    protected sortProperty: SortProperty;

    /**
     * Line length of a motion
     */
    private motionLineLength: number;

    /**
     * Creates a MotionRepository
     *
     * Converts existing and incoming motions to ViewMotions
     * Handles CRUD using an observer to the DataStore
     *
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     * @param dataSend sending changed objects
     * @param viewModelStoreService ViewModelStoreService
     * @param translate
     * @param relationManager
     * @param httpService OpenSlides own Http service
     * @param lineNumbering Line numbering for motion text
     * @param diff Display changes in motion text as diff.
     * @param config ConfigService (subscribe to sorting config)
     * @param operator
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        protected translate: TranslateService,
        relationManager: RelationManagerService,
        config: ConfigService,
        private httpService: HttpService,
        private readonly lineNumbering: LinenumberingService,
        private readonly diff: DiffService,
        private operator: OperatorService
    ) {
        super(
            DS,
            dataSend,
            mapperService,
            viewModelStoreService,
            translate,
            relationManager,
            Motion,
            MotionRelations,
            MotionNestedModelDescriptors
        );
        config.get<SortProperty>('motions_motions_sorting').subscribe(conf => {
            this.sortProperty = conf;
            this.setConfigSortFn();
        });

        config.get<number>('motions_line_length').subscribe(lineLength => {
            this.motionLineLength = lineLength;
        });
    }

    public getTitle = (titleInformation: MotionTitleInformation) => {
        if (titleInformation.identifier) {
            return `${titleInformation.identifier}: ${titleInformation.title}`;
        } else {
            return titleInformation.title;
        }
    };

    public getIdentifierOrTitle = (titleInformation: MotionTitleInformation) => {
        if (titleInformation.identifier) {
            return titleInformation.identifier;
        } else {
            return titleInformation.title;
        }
    };

    public getAgendaSlideTitle = (titleInformation: MotionTitleInformation) => {
        const numberPrefix = titleInformation.agenda_item_number() ? `${titleInformation.agenda_item_number()} · ` : '';
        // if the identifier is set, the title will be 'Motion <identifier>'.
        if (titleInformation.identifier) {
            return `${numberPrefix} ${this.translate.instant('Motion')} ${titleInformation.identifier}`;
        } else {
            return `${numberPrefix} ${titleInformation.title}`;
        }
    };

    public getAgendaListTitle = (titleInformation: MotionTitleInformation) => {
        let numberPrefix = '';
        /**
         * after reloading, titleInformation.agenda_item_number is undefined. It gets defined after
         * an autoupdate
         */
        if (titleInformation.agenda_item_number && titleInformation.agenda_item_number()) {
            numberPrefix = `${titleInformation.agenda_item_number()} · `;
        }

        // Append the verbose name only, if not the special format 'Motion <identifier>' is used.
        let title;
        if (titleInformation.identifier) {
            title = `${numberPrefix}${this.translate.instant('Motion')} ${titleInformation.identifier} · ${
                titleInformation.title
            }`;
        } else {
            title = `${numberPrefix}${titleInformation.title} (${this.getVerboseName()})`;
        }
        const agendaTitle: AgendaListTitle = { title };

        // Subtitle.
        // This is a bit hacky: If one has not motions.can_see, the titleinformation is nut sufficient for
        // submitters. So try-cast titleInformation to a ViewMotion and check, if submittersAsUsers is available
        const viewMotion: ViewMotion = titleInformation as ViewMotion;
        if (viewMotion.submittersAsUsers && viewMotion.submittersAsUsers.length) {
            agendaTitle.subtitle = `${this.translate.instant('by')} ${viewMotion.submittersAsUsers.join(', ')}`;
        }
        return agendaTitle;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Motions' : 'Motion');
    };

    public getProjectorTitle = (viewMotion: ViewMotion) => {
        const subtitle = viewMotion.item && viewMotion.item.comment ? viewMotion.item.comment : null;
        return { title: this.getAgendaSlideTitle(viewMotion), subtitle };
    };

    protected createViewModelWithTitles(model: Motion): ViewMotion {
        const viewModel = super.createViewModelWithTitles(model);

        viewModel.getIdentifierOrTitle = () => this.getIdentifierOrTitle(viewModel);
        viewModel.getProjectorTitle = () => this.getProjectorTitle(viewModel);

        return viewModel;
    }

    protected extendRelations(): void {
        this.relationDefinitions.push({
            type: 'custom',
            ownKey: 'personalNote',
            get: (motion: Motion, viewMotion: ViewMotion) => {
                return this.getPersonalNoteForMotion(motion);
            },
            getCacheObjectToCheck: (viewMotion: ViewMotion) => this.getPersonalNote()
        });
        this.relationDefinitions.push({
            type: 'custom',
            ownKey: 'diffLines',
            get: (motion: Motion, viewMotion: ViewMotion) => {
                if (viewMotion.parent && viewMotion.isParagraphBasedAmendment()) {
                    const changeRecos = viewMotion.changeRecommendations.filter(changeReco =>
                        changeReco.showInFinalView()
                    );
                    try {
                        return this.getAmendmentParagraphLines(
                            viewMotion,
                            this.motionLineLength,
                            ChangeRecoMode.Changed,
                            changeRecos,
                            false
                        );
                    } catch (e) {
                        // Inconsistency between motion and amendment -> the best we can do is not to fail completely
                        return [];
                    }
                } else {
                    return [];
                }
            },
            getCacheObjectToCheck: (viewMotion: ViewMotion) => viewMotion.parent
        });
        super.extendRelations();
    }

    /**
     * @returns the personal note for the operator.
     */
    private getPersonalNote(): ViewPersonalNote | null {
        return this.viewModelStoreService.find(ViewPersonalNote, pn => {
            return pn.user_id === this.operator.user.id;
        });
    }

    /**
     * Get the personal note content for one motion by their id
     *
     * @param motion the motion
     * @returns the personal note content for this motion or null
     */
    private getPersonalNoteForMotion(motion: Motion): PersonalNoteContent | null {
        if (this.operator.isAnonymous) {
            return;
        }

        const personalNote = this.getPersonalNote();
        if (!personalNote) {
            return;
        }

        const notes = personalNote.notes;
        const collection = Motion.COLLECTIONSTRING;
        if (notes && notes[collection] && notes[collection][motion.id]) {
            return notes[collection][motion.id];
        }
    }

    /**
     * Set the state of a motion
     *
     * @param viewMotion target motion
     * @param stateId the number that indicates the state
     */
    public async setState(viewMotion: ViewMotion, stateId: number): Promise<void> {
        const restPath = `/rest/motions/motion/${viewMotion.id}/set_state/`;
        await this.httpService.put(restPath, { state: stateId });
    }

    /**
     * Set the state of motions in bulk
     *
     * @param viewMotions target motions
     * @param stateId the number that indicates the state
     */
    public async setMultiState(viewMotions: ViewMotion[], stateId: number): Promise<void> {
        const restPath = `/rest/motions/motion/manage_multiple_state/`;
        const motionsIdMap: { id: number; state: number }[] = viewMotions.map(motion => {
            return { id: motion.id, state: stateId };
        });
        await this.httpService.post(restPath, { motions: motionsIdMap });
    }

    /**
     * Set the motion blocks of motions in bulk
     *
     * @param viewMotions target motions
     * @param motionblockId the number that indicates the motion block
     */
    public async setMultiMotionBlock(viewMotions: ViewMotion[], motionblockId: number): Promise<void> {
        const restPath = `/rest/motions/motion/manage_multiple_motion_block/`;
        const motionsIdMap: { id: number; motion_block: number }[] = viewMotions.map(motion => {
            return { id: motion.id, motion_block: motionblockId };
        });
        await this.httpService.post(restPath, { motions: motionsIdMap });
    }

    /**
     * Set the category of motions in bulk
     *
     * @param viewMotions target motions
     * @param categoryId the number that indicates the category
     */
    public async setMultiCategory(viewMotions: ViewMotion[], categoryId: number): Promise<void> {
        const restPath = `/rest/motions/motion/manage_multiple_category/`;
        const motionsIdMap: { id: number; category: number }[] = viewMotions.map(motion => {
            return { id: motion.id, category: categoryId };
        });
        await this.httpService.post(restPath, { motions: motionsIdMap });
    }

    /**
     * Set the recommenders state of a motion
     *
     * @param viewMotion target motion
     * @param recommendationId the number that indicates the recommendation
     */
    public async setRecommendation(viewMotion: ViewMotion, recommendationId: number): Promise<void> {
        const restPath = `/rest/motions/motion/${viewMotion.id}/set_recommendation/`;
        await this.httpService.put(restPath, { recommendation: recommendationId });
    }

    /**
     * Set the category of a motion
     *
     * @param viewMotion target motion
     * @param categoryId the number that indicates the category
     */
    public async setCatetory(viewMotion: ViewMotion, categoryId: number): Promise<void> {
        await this.patch({ category_id: categoryId }, viewMotion);
    }

    /**
     * Add the motion to a motion block
     *
     * @param viewMotion the motion to add
     * @param blockId the ID of the motion block
     */
    public async setBlock(viewMotion: ViewMotion, blockId: number): Promise<void> {
        await this.patch({ motion_block_id: blockId }, viewMotion);
    }

    /**
     * Adds new or removes existing tags from motions
     *
     * @param viewMotion the motion to tag
     * @param tagId the tags id to add or remove
     */
    public async setTag(viewMotion: ViewMotion, tagId: number): Promise<void> {
        const tags = viewMotion.motion.tags_id.map(tag => tag);
        const tagIndex = tags.findIndex(tag => tag === tagId);

        if (tagIndex === -1) {
            // add tag to motion
            tags.push(tagId);
        } else {
            // remove tag from motion
            tags.splice(tagIndex, 1);
        }
        await this.patch({ tags_id: tags }, viewMotion);
    }

    /**
     * Sets the submitters by sending a request to the server,
     *
     * @param viewMotion The motion to change the submitters from
     * @param submitterUserIds The submitters to set
     */
    public async setSubmitters(viewMotion: ViewMotion, submitterUserIds: number[]): Promise<void> {
        const requestData = {
            motions: [
                {
                    id: viewMotion.id,
                    submitters: submitterUserIds
                }
            ]
        };
        await this.httpService.post('/rest/motions/motion/manage_multiple_submitters/', requestData);
    }

    /**
     * Sends the changed nodes to the server.
     *
     * @param data The reordered data from the sorting
     */
    public async sortMotions(data: TreeIdNode[]): Promise<void> {
        await this.httpService.post('/rest/motions/motion/sort/', data);
    }

    /**
     * Supports the motion
     *
     * @param viewMotion target motion
     */
    public async support(viewMotion: ViewMotion): Promise<void> {
        const url = `/rest/motions/motion/${viewMotion.id}/support/`;
        await this.httpService.post(url);
    }

    /**
     * Unsupports the motion
     *
     * @param viewMotion target motion
     */
    public async unsupport(viewMotion: ViewMotion): Promise<void> {
        const url = `/rest/motions/motion/${viewMotion.id}/support/`;
        await this.httpService.delete(url);
    }

    /**
     * Returns an observable returning the amendments to a given motion
     *
     * @param {number} motionId
     * @returns {Observable<ViewMotion[]>}
     */
    public amendmentsTo(motionId: number): Observable<ViewMotion[]> {
        return this.getViewModelListObservable().pipe(
            map((motions: ViewMotion[]): ViewMotion[] => {
                return motions.filter((motion: ViewMotion): boolean => {
                    return motion.parent_id === motionId;
                });
            })
        );
    }

    /**
     * Returns an observable for all motions, that referencing the given motion (via id)
     * in the recommendation.
     */
    public getRecommendationReferencingMotions(motionId: number): Observable<ViewMotion[]> {
        return this.getViewModelListObservable().pipe(
            map((motions: ViewMotion[]): ViewMotion[] => {
                return motions.filter((motion: ViewMotion): boolean => {
                    if (!motion.recommendationExtension) {
                        return false;
                    }

                    // Check, if this motion has the motionId in it's recommendation
                    const placeholderRegex = /\[motion:(\d+)\]/g;
                    let match;
                    while ((match = placeholderRegex.exec(motion.recommendationExtension))) {
                        if (parseInt(match[1], 10) === motionId) {
                            return true;
                        }
                    }

                    return false;
                });
            })
        );
    }

    /**
     * @returns all amendments
     */
    public getAllAmendmentsInstantly(): ViewMotion[] {
        return this.getViewModelList().filter(motion => !!motion.parent_id);
    }

    /**
     * Returns the amendments to a given motion
     *
     * @param motionId the motion ID to get the amendments to
     */
    public getAmendmentsInstantly(motionId: number): ViewMotion[] {
        return this.getViewModelList().filter(motion => motion.parent_id === motionId);
    }

    /**
     * Format the motion text using the line numbering and change
     * reco algorithm.
     *
     * Can be called from detail view and exporter
     * @param id Motion ID - will be pulled from the repository
     * @param crMode indicator for the change reco mode
     * @param changes all change recommendations and amendments, sorted by line number
     * @param lineLength the current line
     * @param highlightLine the currently highlighted line (default: none)
     */
    public formatMotion(
        id: number,
        crMode: ChangeRecoMode,
        changes: ViewUnifiedChange[],
        lineLength: number,
        highlightLine?: number
    ): string {
        const targetMotion = this.getViewModel(id);

        if (targetMotion && targetMotion.text) {
            switch (crMode) {
                case ChangeRecoMode.Original:
                    return this.lineNumbering.insertLineNumbers(targetMotion.text, lineLength, highlightLine);
                case ChangeRecoMode.Changed:
                    const changeRecommendations = changes.filter(
                        change => change.getChangeType() === ViewUnifiedChangeType.TYPE_CHANGE_RECOMMENDATION
                    );
                    return this.diff.getTextWithChanges(
                        targetMotion.text,
                        changeRecommendations,
                        lineLength,
                        highlightLine
                    );
                case ChangeRecoMode.Diff:
                    const text = [];
                    const changesToShow = changes.filter(change => change.showInDiffView());
                    const motionText = this.lineNumbering.insertLineNumbers(targetMotion.text, lineLength);

                    for (let i = 0; i < changesToShow.length; i++) {
                        text.push(
                            this.diff.extractMotionLineRange(
                                motionText,
                                {
                                    from: i === 0 ? 1 : changesToShow[i - 1].getLineTo(),
                                    to: changesToShow[i].getLineFrom()
                                },
                                true,
                                lineLength,
                                highlightLine
                            )
                        );

                        text.push(this.diff.getChangeDiff(motionText, changesToShow[i], lineLength, highlightLine));
                    }

                    text.push(
                        this.diff.getTextRemainderAfterLastChange(motionText, changesToShow, lineLength, highlightLine)
                    );
                    return text.join('');
                case ChangeRecoMode.Final:
                    const appliedChanges: ViewUnifiedChange[] = changes.filter(change => change.showInFinalView());
                    return this.diff.getTextWithChanges(targetMotion.text, appliedChanges, lineLength, highlightLine);
                case ChangeRecoMode.ModifiedFinal:
                    if (targetMotion.modified_final_version) {
                        return this.lineNumbering.insertLineNumbers(
                            targetMotion.modified_final_version,
                            lineLength,
                            highlightLine,
                            null,
                            1
                        );
                    } else {
                        // Use the final version as fallback, if the modified does not exist.
                        return this.formatMotion(id, ChangeRecoMode.Final, changes, lineLength, highlightLine);
                    }
                default:
                    console.error('unrecognized ChangeRecoMode option (' + crMode + ')');
                    return null;
            }
        } else {
            return null;
        }
    }

    public formatStatuteAmendment(
        paragraphs: ViewStatuteParagraph[],
        amendment: ViewMotion,
        lineLength: number
    ): string {
        const origParagraph = paragraphs.find(paragraph => paragraph.id === amendment.statute_paragraph_id);
        if (origParagraph) {
            let diffHtml = this.diff.diff(origParagraph.text, amendment.text);
            diffHtml = this.lineNumbering.insertLineBreaksWithoutNumbers(diffHtml, lineLength, true);
            return diffHtml;
        }
    }

    /**
     * Returns the last line number of a motion
     *
     * @param {ViewMotion} motion
     * @param {number} lineLength
     * @return {number}
     */
    public getLastLineNumber(motion: ViewMotion, lineLength: number): number {
        const numberedHtml = this.lineNumbering.insertLineNumbers(motion.text, lineLength);
        const range = this.lineNumbering.getLineNumberRange(numberedHtml);
        return range.to;
    }

    /**
     * Splits a motion into paragraphs, optionally adding line numbers
     *
     * @param {ViewMotion} motion
     * @param {boolean} lineBreaks
     * @param {number} lineLength
     * @returns {string[]}
     */
    public getTextParagraphs(motion: ViewMotion, lineBreaks: boolean, lineLength: number): string[] {
        if (!motion) {
            return [];
        }
        let html = motion.text;
        if (lineBreaks) {
            html = this.lineNumbering.insertLineNumbers(html, lineLength);
        }
        return this.lineNumbering.splitToParagraphs(html);
    }

    /**
     * Returns the data structure used for creating and editing amendments
     *
     * @param {ViewMotion} motion
     * @param {number} lineLength
     */
    public getParagraphsToChoose(motion: ViewMotion, lineLength: number): ParagraphToChoose[] {
        const parent = motion.hasParent ? motion.parent : motion;
        return this.getTextParagraphs(parent, true, lineLength).map((paragraph: string, index: number) => {
            let localParagraph;
            if (motion.hasParent) {
                localParagraph = motion.amendment_paragraphs[index] ? motion.amendment_paragraphs[index] : paragraph;
            } else {
                localParagraph = paragraph;
            }
            return this.extractAffectedParagraphs(localParagraph, index);
        });
    }

    /**
     * To create paragraph based amendments for amendments, creates diffed paragraphs
     * for selection
     */
    public getDiffedParagraphToChoose(amendment: ViewMotion, lineLength: number): ParagraphToChoose[] {
        if (amendment.hasParent) {
            const parent = amendment.parent;

            return this.getTextParagraphs(parent, true, lineLength).map((paragraph: string, index: number) => {
                const diffedParagraph = amendment.amendment_paragraphs[index]
                    ? this.diff.diff(paragraph, amendment.amendment_paragraphs[index], lineLength)
                    : paragraph;
                return this.extractAffectedParagraphs(diffedParagraph, index);
            });
        } else {
            throw new Error('getDiffedParagraphToChoose: given amendment has no parent');
        }
    }

    /**
     * Creates a selectable and editable paragraph
     */
    private extractAffectedParagraphs(paragraph: string, index: number): ParagraphToChoose {
        const affected: LineNumberRange = this.lineNumbering.getLineNumberRange(paragraph);
        return {
            paragraphNo: index,
            html: this.lineNumbering.stripLineNumbers(paragraph),
            lineFrom: affected.from,
            lineTo: affected.to
        } as ParagraphToChoose;
    }

    /**
     * Returns the amended paragraphs by an amendment. Correlates to the amendment_paragraphs field,
     * but also considers relevant change recommendations.
     * The returned array includes "null" values for paragraphs that have not been changed.
     *
     * @param {ViewMotion} amendment
     * @param {number} lineLength
     * @param {ViewMotionChangeRecommendation[]} changes
     * @param {boolean} includeUnchanged
     * @returns {string[]}
     */
    public applyChangesToAmendment(
        amendment: ViewMotion,
        lineLength: number,
        changes: ViewMotionChangeRecommendation[],
        includeUnchanged: boolean
    ): string[] {
        const motion = amendment.parent;
        const baseParagraphs = this.getTextParagraphs(motion, true, lineLength);

        // Changes need to be applied from the bottom up, to prevent conflicts with changing line numbers.
        changes.sort((change1: ViewUnifiedChange, change2: ViewUnifiedChange) => {
            if (change1.getLineFrom() < change2.getLineFrom()) {
                return 1;
            } else if (change1.getLineFrom() > change2.getLineFrom()) {
                return -1;
            } else {
                return 0;
            }
        });

        return amendment.amendment_paragraphs?.map((newText: string, paraNo: number) => {
            let paragraph: string;
            let paragraphHasChanges;

            if (baseParagraphs[paraNo] === undefined) {
                const msg =
                    this.translate.instant('Inconsistent data.') +
                    ' ' +
                    this.translate.instant('An amendment is probably referring to a non-existant line number.') +
                    ' ' +
                    this.translate.instant('You can back up its content when editing it and delete it afterwards.');
                return '<em style="color: red; font-weight: bold;">' + msg + '</em>';
            }

            if (newText === null) {
                paragraph = baseParagraphs[paraNo];
                paragraphHasChanges = false;
            } else {
                // Add line numbers to newText, relative to the baseParagraph, by creating a diff
                // to the line numbered base version any applying it right away
                const diff = this.diff.diff(baseParagraphs[paraNo], newText);
                paragraph = this.diff.diffHtmlToFinalText(diff);
                paragraphHasChanges = true;
            }

            const affected: LineNumberRange = this.lineNumbering.getLineNumberRange(paragraph);

            changes.forEach((change: ViewMotionChangeRecommendation) => {
                // Hint: this assumes that change recommendations only affect one specific paragraph, not multiple
                if (change.line_from >= affected.from && change.line_from < affected.to) {
                    paragraph = this.diff.replaceLines(paragraph, change.text, change.line_from, change.line_to);

                    // Reapply relative line numbers
                    const diff = this.diff.diff(baseParagraphs[paraNo], paragraph);
                    paragraph = this.diff.diffHtmlToFinalText(diff);

                    paragraphHasChanges = true;
                }
            });

            if (paragraphHasChanges || includeUnchanged) {
                return paragraph;
            } else {
                return null;
            }
        });
    }

    /**
     * Returns all paragraph lines that are affected by the given amendment in diff-format, including context.
     *
     * Should only be called for paragraph-based amendments.
     *
     * @param {ViewMotion} amendment
     * @param {number} lineLength
     * @param {ChangeRecoMode} crMode
     * @param {ViewMotionChangeRecommendation[]} changeRecommendations
     * @param {boolean} includeUnchanged
     * @returns {DiffLinesInParagraph}
     * @throws Error
     */
    public getAmendmentParagraphLines(
        amendment: ViewMotion,
        lineLength: number,
        crMode: ChangeRecoMode,
        changeRecommendations: ViewMotionChangeRecommendation[],
        includeUnchanged: boolean
    ): DiffLinesInParagraph[] {
        const motion = amendment.parent;
        const baseParagraphs = this.getTextParagraphs(motion, true, lineLength);

        let amendmentParagraphs;
        if (crMode === ChangeRecoMode.Changed) {
            amendmentParagraphs = this.applyChangesToAmendment(amendment, lineLength, changeRecommendations, true);
        } else {
            amendmentParagraphs = amendment.amendment_paragraphs || [];
        }

        return amendmentParagraphs
            ?.map(
                (newText: string, paraNo: number): DiffLinesInParagraph => {
                    if (baseParagraphs[paraNo] === undefined) {
                        throw new Error(
                            this.translate.instant('Inconsistent data.') +
                                ' ' +
                                this.translate.instant(
                                    'An amendment is probably referring to a non-existant line number.'
                                )
                        );
                    } else if (newText !== null) {
                        return this.diff.getAmendmentParagraphsLines(
                            paraNo,
                            baseParagraphs[paraNo],
                            newText,
                            lineLength
                        );
                    } else {
                        return null; // Nothing has changed in this paragraph
                    }
                }
            )
            .map((diffLines: DiffLinesInParagraph, paraNo: number) => {
                // If nothing has changed and we want to keep unchanged paragraphs for the context,
                // return the original text in "textPre"
                if (diffLines === null && includeUnchanged) {
                    const paragraph_line_range = this.lineNumbering.getLineNumberRange(baseParagraphs[paraNo]);
                    return {
                        paragraphNo: paraNo,
                        paragraphLineFrom: paragraph_line_range.from,
                        paragraphLineTo: paragraph_line_range.to,
                        diffLineFrom: paragraph_line_range.to,
                        diffLineTo: paragraph_line_range.to,
                        textPre: baseParagraphs[paraNo],
                        text: '',
                        textPost: ''
                    } as DiffLinesInParagraph;
                } else {
                    return diffLines;
                }
            })
            .filter((para: DiffLinesInParagraph) => para !== null);
    }

    public getAmendmentParagraphLinesTitle(paragraph: DiffLinesInParagraph): string {
        if (paragraph.diffLineTo === paragraph.diffLineFrom + 1) {
            return this.translate.instant('Line') + ' ' + paragraph.diffLineFrom.toString(10);
        } else {
            return (
                this.translate.instant('Line') +
                ' ' +
                paragraph.diffLineFrom.toString(10) +
                ' - ' +
                (paragraph.diffLineTo - 1).toString(10)
            );
        }
    }

    /**
     * Returns all paragraphs that are affected by the given amendment as unified change objects.
     * Only the affected part of each paragraph is returned.
     * Change recommendations to this amendment are considered here, too. That is, if a change recommendation
     * for an amendment exists and is not rejected, the changed amendment will be returned here.
     *
     * @param {ViewMotion} amendment
     * @param {number} lineLength
     * @param {ViewMotionChangeRecommendation[]} changeRecos
     * @returns {ViewMotionAmendedParagraph[]}
     */
    public getAmendmentAmendedParagraphs(
        amendment: ViewMotion,
        lineLength: number,
        changeRecos: ViewMotionChangeRecommendation[]
    ): ViewMotionAmendedParagraph[] {
        const motion = amendment.parent;
        const baseParagraphs = this.getTextParagraphs(motion, true, lineLength);
        const changedAmendmentParagraphs = this.applyChangesToAmendment(amendment, lineLength, changeRecos, false);

        return changedAmendmentParagraphs
            ?.map(
                (newText: string, paraNo: number): ViewMotionAmendedParagraph => {
                    if (newText === null) {
                        return null;
                    }
                    if (baseParagraphs[paraNo] === undefined) {
                        console.error(
                            this.translate.instant('Inconsistent data.') +
                                ' ' +
                                this.translate.instant(
                                    'An amendment is probably referring to a non-existant line number.'
                                )
                        );
                        return null;
                    }

                    const origText = baseParagraphs[paraNo],
                        diff = this.diff.diff(origText, newText),
                        affectedLines = this.diff.detectAffectedLineRange(diff);

                    if (affectedLines === null) {
                        return null;
                    }
                    const affectedDiff = this.diff.formatDiff(
                        this.diff.extractRangeByLineNumbers(diff, affectedLines.from, affectedLines.to)
                    );
                    const affectedConsolidated = this.diff.diffHtmlToFinalText(affectedDiff);

                    return new ViewMotionAmendedParagraph(amendment, paraNo, affectedConsolidated, affectedLines);
                }
            )
            .filter((para: ViewMotionAmendedParagraph) => para !== null);
    }

    /**
     * For unchanged paragraphs, this returns the original motion paragraph, including line numbers.
     * For changed paragraphs, this returns the content of the amendment_paragraphs-field,
     *     but including line numbers relative to the original motion line numbers,
     *     so they can be used for the amendment change recommendations
     *
     * @param {ViewMotion} amendment
     * @param {number} lineLength
     * @param {boolean} withDiff
     * @returns {LineNumberedString[]}
     */
    public getAllAmendmentParagraphsWithOriginalLineNumbers(
        amendment: ViewMotion,
        lineLength: number,
        withDiff: boolean
    ): LineNumberedString[] {
        const motion = amendment.parent;
        const baseParagraphs = this.getTextParagraphs(motion, true, lineLength);

        return (amendment.amendment_paragraphs || []).map((newText: string, paraNo: number): string => {
            const origText = baseParagraphs[paraNo];
            if (origText === undefined) {
                throw new Error(
                    this.translate.instant('Inconsistent data.') +
                        ' ' +
                        this.translate.instant('An amendment is probably referring to a non-existant line number.')
                );
            }

            if (newText === null) {
                return origText;
            }

            const diff = this.diff.diff(origText, newText);

            if (withDiff) {
                return diff;
            } else {
                return this.diff.diffHtmlToFinalText(diff);
            }
        });
    }

    /**
     * Signals the acceptance of the current recommendation to the server
     *
     * @param motion A ViewMotion
     */
    public async followRecommendation(motion: ViewMotion): Promise<void> {
        if (motion.recommendation_id) {
            const restPath = `/rest/motions/motion/${motion.id}/follow_recommendation/`;
            await this.httpService.post(restPath);
        }
    }
    /**
     * Check if a motion currently has any amendments
     *
     * @param motion A viewMotion
     * @returns True if there is at eleast one amendment
     */
    public hasAmendments(motion: ViewMotion): boolean {
        return this.getViewModelList().filter(allMotions => allMotions.parent_id === motion.id).length > 0;
    }

    /**
     * updates the state Extension with the string given, if the current workflow allows for it
     *
     * @param viewMotion
     * @param value
     */
    public async setStateExtension(viewMotion: ViewMotion, value: string): Promise<void> {
        if (viewMotion.state.show_state_extension_field) {
            return this.patch({ state_extension: value }, viewMotion);
        }
    }

    /**
     * updates the recommendation extension with the string given, if the current workflow allows for it
     *
     * @param viewMotion
     * @param value
     */
    public async setRecommendationExtension(viewMotion: ViewMotion, value: string): Promise<void> {
        if (viewMotion.recommendation.show_recommendation_extension_field) {
            return this.patch({ recommendation_extension: value }, viewMotion);
        }
    }

    /**
     * Get the label for the motion's current state with the extension
     * attached (if available). For cross-referencing other motions, `[motion:id]`
     * will replaced by the referenced motion's identifier (see {@link solveExtensionPlaceHolder})
     *
     * @param motion
     * @returns the translated state with the extension attached
     */
    public getExtendedStateLabel(motion: ViewMotion): string {
        if (!motion.state) {
            return null;
        }
        let state = this.translate.instant(motion.state.name);
        if (motion.stateExtension && motion.state.show_state_extension_field) {
            state += ' ' + this.parseMotionPlaceholders(motion.stateExtension);
        }
        return state;
    }

    /**
     * Get the label for the motion's current recommendation with the extension
     * attached (if available)
     *
     * @param motion
     * @returns the translated extension with the extension attached
     */
    public getExtendedRecommendationLabel(motion: ViewMotion): string {
        if (motion.recommendation) {
            let rec = this.translate.instant(motion.recommendation.recommendation_label);
            if (motion.recommendationExtension && motion.recommendation.show_recommendation_extension_field) {
                rec += ' ' + this.parseMotionPlaceholders(motion.recommendationExtension);
            }
            return rec;
        }
        return '';
    }

    /**
     * Replaces any motion placeholder (`[motion:id]`) with the motion's title(s)
     *
     * @param value
     * @returns the string with the motion titles replacing the placeholders
     */
    public parseMotionPlaceholders(value: string): string {
        return value.replace(/\[motion:(\d+)\]/g, (match, id) => {
            const motion = this.getViewModel(id);
            if (motion) {
                return motion.getIdentifierOrTitle();
            } else {
                return this.translate.instant('<unknown motion>');
            }
        });
    }

    /**
     * Triggers an update for the sort function responsible for the default sorting of data items
     */
    public setConfigSortFn(): void {
        this.setSortFunction((a: ViewMotion, b: ViewMotion) => {
            if (a[this.sortProperty] && b[this.sortProperty]) {
                if (a[this.sortProperty] === b[this.sortProperty]) {
                    return this.languageCollator.compare(a.title, b.title);
                } else {
                    if (this.sortProperty === 'weight') {
                        // handling numerical values
                        return a.weight - b.weight;
                    } else {
                        return this.languageCollator.compare(a[this.sortProperty], b[this.sortProperty]);
                    }
                }
            } else if (a[this.sortProperty]) {
                return -1;
            } else if (b[this.sortProperty]) {
                return 1;
            } else {
                return this.languageCollator.compare(a.title, b.title);
            }
        });
    }

    public changeHasCollissions(change: ViewUnifiedChange, changes: ViewUnifiedChange[]): boolean {
        return (
            changes.filter((otherChange: ViewUnifiedChange) => {
                return (
                    otherChange.getChangeId() !== change.getChangeId() &&
                    ((otherChange.getLineFrom() >= change.getLineFrom() &&
                        otherChange.getLineFrom() < change.getLineTo()) ||
                        (otherChange.getLineTo() > change.getLineFrom() &&
                            otherChange.getLineTo() <= change.getLineTo()) ||
                        (otherChange.getLineFrom() < change.getLineFrom() &&
                            otherChange.getLineTo() > change.getLineTo()))
                );
            }).length > 0
        );
    }

    /**
     * Tries to determine the realistic CR-Mode from a given CR mode
     */
    public determineCrMode(
        mode: ChangeRecoMode,
        hasChangingObjects: boolean,
        isModifiedFinalVersion: boolean,
        isParagraphBasedAmendment: boolean,
        hasChangeRecommendations: boolean
    ): ChangeRecoMode {
        if (mode === ChangeRecoMode.Final) {
            if (isModifiedFinalVersion) {
                return ChangeRecoMode.ModifiedFinal;
                /**
                 * Because without change recos you cannot escape the final version anymore
                 */
            } else if (!hasChangingObjects) {
                return ChangeRecoMode.Original;
            }
        } else if (mode === ChangeRecoMode.Changed && !hasChangingObjects) {
            /**
             * Because without change recos you cannot escape the changed version view
             * You will not be able to automatically change to the Changed view after creating
             * a change reco. The autoupdate has to come "after" this routine
             */
            return ChangeRecoMode.Original;
        } else if (mode === ChangeRecoMode.Diff && !hasChangeRecommendations && isParagraphBasedAmendment) {
            /**
             * The Diff view for paragraph-based amendments is only relevant for change recommendations;
             * the regular amendment changes are shown in the "original" view.
             */
            return ChangeRecoMode.Original;
        }
        return mode;
    }
}
