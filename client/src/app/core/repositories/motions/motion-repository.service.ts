import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

import { Category } from 'app/shared/models/motions/category';
import { ChangeRecoMode, ViewMotion } from 'app/site/motions/models/view-motion';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { CreateMotion } from 'app/site/motions/models/create-motion';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { DiffLinesInParagraph, DiffService, LineRange, ModificationType } from '../../ui-services/diff.service';
import { HttpService } from 'app/core/core-services/http.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { Item } from 'app/shared/models/agenda/item';
import { LinenumberingService } from '../../ui-services/linenumbering.service';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { Motion } from 'app/shared/models/motions/motion';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { MotionChangeRecommendation } from 'app/shared/models/motions/motion-change-reco';
import { MotionPoll } from 'app/shared/models/motions/motion-poll';
import { OSTreeSortEvent } from 'app/shared/components/sorting-tree/sorting-tree.component';
import { PersonalNoteService } from '../../ui-services/personal-note.service';
import { TreeService } from 'app/core/ui-services/tree.service';
import { User } from 'app/shared/models/users/user';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-change-recommendation';
import { ViewMotionAmendedParagraph } from 'app/site/motions/models/view-motion-amended-paragraph';
import { ViewUnifiedChange } from '../../../shared/models/motions/view-unified-change';
import { ViewStatuteParagraph } from 'app/site/motions/models/view-statute-paragraph';
import { Workflow } from 'app/shared/models/motions/workflow';
import { WorkflowState } from 'app/shared/models/motions/workflow-state';
import { Tag } from 'app/shared/models/core/tag';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ViewCategory } from 'app/site/motions/models/view-category';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewWorkflow } from 'app/site/motions/models/view-workflow';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewMotionBlock } from 'app/site/motions/models/view-motion-block';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { BaseAgendaContentObjectRepository } from '../base-agenda-content-object-repository';

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
export class MotionRepositoryService extends BaseAgendaContentObjectRepository<ViewMotion, Motion> {
    /**
     * Creates a MotionRepository
     *
     * Converts existing and incoming motions to ViewMotions
     * Handles CRUD using an observer to the DataStore
     *
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     * @param dataSend sending changed objects
     * @param httpService OpenSlides own Http service
     * @param lineNumbering Line numbering for motion text
     * @param diff Display changes in motion text as diff.
     * @param personalNoteService service fo personal notes
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        private dataSend: DataSendService,
        private httpService: HttpService,
        private readonly lineNumbering: LinenumberingService,
        private readonly diff: DiffService,
        private treeService: TreeService,
        private personalNoteService: PersonalNoteService,
        private translate: TranslateService
    ) {
        super(DS, mapperService, viewModelStoreService, Motion, [
            Category,
            User,
            Workflow,
            Item,
            MotionBlock,
            Mediafile,
            Tag
        ]);
    }

    public getTitle = (motion: Partial<Motion> | Partial<ViewMotion>) => {
        if (motion.identifier) {
            return motion.identifier + ': ' + motion.title;
        } else {
            return motion.title;
        }
    };

    public getIdentifierOrTitle = (motion: Partial<Motion> | Partial<ViewMotion>) => {
        if (motion.identifier) {
            return motion.identifier;
        } else {
            return motion.title;
        }
    };

    public getAgendaTitle = (motion: Partial<Motion> | Partial<ViewMotion>) => {
        // if the identifier is set, the title will be 'Motion <identifier>'.
        if (motion.identifier) {
            return this.translate.instant('Motion') + ' ' + motion.identifier;
        } else {
            return motion.title;
        }
    };

    public getAgendaTitleWithType = (motion: Partial<Motion> | Partial<ViewMotion>) => {
        // Append the verbose name only, if not the special format 'Motion <identifier>' is used.
        if (motion.identifier) {
            return this.translate.instant('Motion') + ' ' + motion.identifier;
        } else {
            return motion.title + ' (' + this.getVerboseName() + ')';
        }
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Motions' : 'Motion');
    };

    /**
     * Converts a motion to a ViewMotion and adds it to the store.
     *
     * Foreign references of the motion will be resolved (e.g submitters to users)
     * Expandable to all (server side) changes that might occur on the motion object.
     *
     * @param motion blank motion domain object
     */
    protected createViewModel(motion: Motion): ViewMotion {
        const category = this.viewModelStoreService.get(ViewCategory, motion.category_id);
        const submitters = this.viewModelStoreService.getMany(ViewUser, motion.sorted_submitters_id);
        const supporters = this.viewModelStoreService.getMany(ViewUser, motion.supporters_id);
        const workflow = this.viewModelStoreService.get(ViewWorkflow, motion.workflow_id);
        const item = this.viewModelStoreService.get(ViewItem, motion.agenda_item_id);
        const block = this.viewModelStoreService.get(ViewMotionBlock, motion.motion_block_id);
        const attachments = this.viewModelStoreService.getMany(ViewMediafile, motion.attachments_id);
        const tags = this.viewModelStoreService.getMany(ViewTag, motion.tags_id);
        const parent = this.viewModelStoreService.get(ViewMotion, motion.parent_id);
        let state: WorkflowState = null;
        if (workflow) {
            state = workflow.getStateById(motion.state_id);
        }
        const viewMotion = new ViewMotion(
            motion,
            category,
            submitters,
            supporters,
            workflow,
            state,
            item,
            block,
            attachments,
            tags,
            parent
        );
        viewMotion.getIdentifierOrTitle = () => this.getIdentifierOrTitle(viewMotion);
        viewMotion.getTitle = () => this.getTitle(viewMotion);
        viewMotion.getVerboseName = this.getVerboseName;
        viewMotion.getAgendaTitle = () => this.getAgendaTitle(viewMotion);
        viewMotion.getProjectorTitle = viewMotion.getAgendaTitle;
        viewMotion.getAgendaTitleWithType = () => this.getAgendaTitleWithType(viewMotion);
        return viewMotion;
    }

    /**
     * Add custom hook into the observables. The motions get a virtual weight (a sequential number) for the
     * call list order. One can just sort for this number instead of dealing with the sort parent id and weight.
     *
     * @override
     */
    public getViewModelListObservable(): Observable<ViewMotion[]> {
        return super.getViewModelListObservable().pipe(
            tap(motions => {
                const iterator = this.treeService.traverseItems(motions, 'weight', 'sort_parent_id');
                let m: IteratorResult<ViewMotion>;
                let virtualWeightCounter = 0;
                while (!(m = iterator.next()).done) {
                    m.value.callListWeight = virtualWeightCounter++;
                    const motion = m.value;
                    this.personalNoteService
                        .getPersonalNoteObserver(motion.motion)
                        .subscribe(note => (motion.personalNote = note));
                }
            })
        );
    }

    /**
     * Creates a motion
     * Creates a (real) motion with patched data and delegate it
     * to the {@link DataSendService}
     *
     * @param update the form data containing the updated values
     * @param viewMotion The View Motion. If not present, a new motion will be created
     */
    public async create(motion: CreateMotion): Promise<Identifiable> {
        // TODO how to handle category id and motion_block id in  CreateMotion?
        return await this.dataSend.createModel(motion);
    }

    /**
     * updates a motion
     *
     * Creates a (real) motion with patched data and delegate it
     * to the {@link DataSendService}
     *
     * @param update the form data containing the updated values
     * @param viewMotion The View Motion. If not present, a new motion will be created
     */
    public async update(update: Partial<Motion>, viewMotion: ViewMotion): Promise<void> {
        const motion = viewMotion.motion;
        motion.patchValues(update);
        return await this.dataSend.partialUpdateModel(motion);
    }

    /**
     * Deleting a motion.
     *
     * Extract the motion out of the motionView and delegate
     * to {@link DataSendService}
     * @param viewMotion
     */
    public async delete(viewMotion: ViewMotion): Promise<void> {
        return await this.dataSend.deleteModel(viewMotion.motion);
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
     * @param viewMotion target motion
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
        const motion = viewMotion.motion;
        motion.category_id = categoryId;
        await this.update(motion, viewMotion);
    }

    /**
     * Add the motion to a motion block
     *
     * @param viewMotion the motion to add
     * @param blockId the ID of the motion block
     */
    public async setBlock(viewMotion: ViewMotion, blockId: number): Promise<void> {
        const motion = viewMotion.motion;
        motion.motion_block_id = blockId;
        await this.update(motion, viewMotion);
    }

    /**
     * Adds new or removes existing tags from motions
     *
     * @param viewMotion the motion to tag
     * @param tagId the tags id to add or remove
     */
    public async setTag(viewMotion: ViewMotion, tagId: number): Promise<void> {
        const motion = viewMotion.motion;
        const tagIndex = motion.tags_id.findIndex(tag => tag === tagId);

        if (tagIndex === -1) {
            // add tag to motion
            motion.tags_id.push(tagId);
        } else {
            // remove tag from motion
            motion.tags_id.splice(tagIndex, 1);
        }
        await this.update(motion, viewMotion);
    }

    /**
     * Sets the submitters by sending a request to the server,
     *
     * @param viewMotion The motion to change the submitters from
     * @param submitters The submitters to set
     */
    public async setSubmitters(viewMotion: ViewMotion, submitters: ViewUser[]): Promise<void> {
        const requestData = {
            motions: [
                {
                    id: viewMotion.id,
                    submitters: submitters.map(s => s.id)
                }
            ]
        };
        this.httpService.post('/rest/motions/motion/manage_multiple_submitters/', requestData);
    }

    /**
     * Sends the changed nodes to the server.
     *
     * @param data The reordered data from the sorting
     */
    public async sortMotions(data: OSTreeSortEvent): Promise<void> {
        const url = '/rest/motions/motion/sort/';
        await this.httpService.post(url, data);
    }

    /**
     * Sends the changed nodes to the server, with only the top nodes being submitted.
     *
     * @param data The reordered data from the sorting, as list of ViewMotions
     * @param parent a parent id
     */
    public async sortMotionBranches(data: ViewMotion[], parent?: number): Promise<void> {
        const url = '/rest/motions/motion/sort/';
        const nodes = data.map(motion => ({ id: motion.id }));
        const params = parent ? { nodes: nodes, parent_id: parent } : { nodes: nodes };
        await this.httpService.post(url, params);
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

    /** Returns an observable returning the amendments to a given motion
     *
     * @param {number} motionId
     * @returns {Observable<ViewMotion[]>}
     */
    public amendmentsTo(motionId: number): Observable<ViewMotion[]> {
        return this.getViewModelListObservable().pipe(
            map(
                (motions: ViewMotion[]): ViewMotion[] => {
                    return motions.filter(
                        (motion: ViewMotion): boolean => {
                            return motion.parent_id === motionId;
                        }
                    );
                }
            )
        );
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
                    return this.diff.getTextWithChanges(targetMotion.text, changes, lineLength, highlightLine);
                case ChangeRecoMode.Diff:
                    let text = '';
                    changes.forEach((change: ViewUnifiedChange, idx: number) => {
                        if (idx === 0) {
                            text += this.extractMotionLineRange(
                                id,
                                {
                                    from: 1,
                                    to: change.getLineFrom()
                                },
                                true,
                                lineLength,
                                highlightLine
                            );
                        } else if (changes[idx - 1].getLineTo() < change.getLineFrom()) {
                            text += this.extractMotionLineRange(
                                id,
                                {
                                    from: changes[idx - 1].getLineTo(),
                                    to: change.getLineFrom()
                                },
                                true,
                                lineLength,
                                highlightLine
                            );
                        }
                        text += this.diff.getChangeDiff(targetMotion.text, change, lineLength, highlightLine);
                    });
                    text += this.diff.getTextRemainderAfterLastChange(
                        targetMotion.text,
                        changes,
                        lineLength,
                        highlightLine
                    );
                    return text;
                case ChangeRecoMode.Final:
                    const appliedChanges: ViewUnifiedChange[] = changes.filter(change => change.isAccepted());
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
     * Extracts a renderable HTML string representing the given line number range of this motion
     *
     * @param {number} id
     * @param {LineRange} lineRange
     * @param {boolean} lineNumbers - weather to add line numbers to the returned HTML string
     * @param {number} lineLength
     * @param {number|null} highlightedLine
     */
    public extractMotionLineRange(
        id: number,
        lineRange: LineRange,
        lineNumbers: boolean,
        lineLength: number,
        highlightedLine: number
    ): string {
        const origHtml = this.formatMotion(id, ChangeRecoMode.Original, [], lineLength);
        const extracted = this.diff.extractRangeByLineNumbers(origHtml, lineRange.from, lineRange.to);
        let html =
            extracted.outerContextStart +
            extracted.innerContextStart +
            extracted.html +
            extracted.innerContextEnd +
            extracted.outerContextEnd;
        if (lineNumbers) {
            html = this.lineNumbering.insertLineNumbers(html, lineLength, highlightedLine, null, lineRange.from);
        }
        return html;
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
     * Creates a {@link ViewMotionChangeRecommendation} object based on the motion ID and the given lange range.
     * This object is not saved yet and does not yet have any changed HTML. It's meant to populate the UI form.
     *
     * @param {number} motionId
     * @param {LineRange} lineRange
     * @param {number} lineLength
     */
    public createChangeRecommendationTemplate(
        motionId: number,
        lineRange: LineRange,
        lineLength: number
    ): ViewMotionChangeRecommendation {
        const changeReco = new MotionChangeRecommendation();
        changeReco.line_from = lineRange.from;
        changeReco.line_to = lineRange.to;
        changeReco.type = ModificationType.TYPE_REPLACEMENT;
        changeReco.text = this.extractMotionLineRange(motionId, lineRange, false, lineLength, null);
        changeReco.rejected = false;
        changeReco.motion_id = motionId;

        return new ViewMotionChangeRecommendation(changeReco);
    }

    /**
     * Given an amendment, this returns the motion affected by this amendments
     *
     * @param {ViewMotion} amendment
     * @returns {ViewMotion}
     */
    public getAmendmentBaseMotion(amendment: ViewMotion): ViewMotion {
        return this.getViewModel(amendment.parent_id);
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
     * Returns all paragraphs that are affected by the given amendment in diff-format
     *
     * @param {ViewMotion} amendment
     * @param {number} lineLength
     * @returns {DiffLinesInParagraph}
     */
    public getAmendedParagraphs(amendment: ViewMotion, lineLength: number): DiffLinesInParagraph[] {
        const motion = this.getAmendmentBaseMotion(amendment);
        const baseParagraphs = this.getTextParagraphs(motion, true, lineLength);

        return amendment.amendment_paragraphs
            .map(
                (newText: string, paraNo: number): DiffLinesInParagraph => {
                    if (newText === null) {
                        return null;
                    }
                    // Hint: can be either DiffLinesInParagraph or null, if no changes are made
                    return this.diff.getAmendmentParagraphsLinesByMode(
                        paraNo,
                        baseParagraphs[paraNo],
                        newText,
                        lineLength
                    );
                }
            )
            .filter((para: DiffLinesInParagraph) => para !== null);
    }

    /**
     * Returns all paragraphs that are affected by the given amendment as unified change objects.
     *
     * @param {ViewMotion} amendment
     * @param {number} lineLength
     * @returns {ViewMotionAmendedParagraph[]}
     */
    public getAmendmentAmendedParagraphs(amendment: ViewMotion, lineLength: number): ViewMotionAmendedParagraph[] {
        const motion = this.getAmendmentBaseMotion(amendment);
        const baseParagraphs = this.getTextParagraphs(motion, true, lineLength);

        return amendment.amendment_paragraphs
            .map(
                (newText: string, paraNo: number): ViewMotionAmendedParagraph => {
                    if (newText === null) {
                        return null;
                    }

                    const origText = baseParagraphs[paraNo],
                        paragraphLines = this.lineNumbering.getLineNumberRange(origText),
                        diff = this.diff.diff(origText, newText),
                        affectedLines = this.diff.detectAffectedLineRange(diff);

                    if (affectedLines === null) {
                        return null;
                    }

                    let newTextLines = this.lineNumbering.insertLineNumbers(
                        newText,
                        lineLength,
                        null,
                        null,
                        paragraphLines.from
                    );
                    newTextLines = this.diff.formatDiff(
                        this.diff.extractRangeByLineNumbers(newTextLines, affectedLines.from, affectedLines.to)
                    );

                    return new ViewMotionAmendedParagraph(amendment, paraNo, newTextLines, affectedLines);
                }
            )
            .filter((para: ViewMotionAmendedParagraph) => para !== null);
    }

    /**
     * Returns motion duplicates (sharing the identifier)
     *
     * @param viewMotion the ViewMotion to compare against the list of Motions
     * in the data
     * @returns An Array of ViewMotions with the same identifier of the input, or an empty array
     */
    public getMotionDuplicates(motion: ViewMotion): ViewMotion[] {
        const duplicates = this.DS.filter(Motion, item => motion.identifier === item.identifier);
        const viewMotions: ViewMotion[] = [];
        duplicates.forEach(item => viewMotions.push(this.createViewModel(item)));
        return viewMotions;
    }

    /**
     * Sends a request to the server, creating a new poll for the motion
     */
    public async createPoll(motion: ViewMotion): Promise<void> {
        const url = '/rest/motions/motion/' + motion.id + '/create_poll/';
        await this.httpService.post(url);
    }

    /**
     * Sends an update request for a poll.
     *
     * @param poll
     */
    public async updatePoll(poll: MotionPoll): Promise<void> {
        const url = '/rest/motions/motion-poll/' + poll.id + '/';
        const data = {
            motion_id: poll.motion_id,
            id: poll.id,
            votescast: poll.votescast,
            votesvalid: poll.votesvalid,
            votesinvalid: poll.votesinvalid,
            votes: {
                Yes: poll.yes,
                No: poll.no,
                Abstain: poll.abstain
            }
        };
        await this.httpService.put(url, data);
    }

    /**
     * Sends a http request to delete the given poll
     *
     * @param poll
     */
    public async deletePoll(poll: MotionPoll): Promise<void> {
        const url = '/rest/motions/motion-poll/' + poll.id + '/';
        await this.httpService.delete(url);
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
            return this.update({ state_extension: value }, viewMotion);
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
            return this.update({ recommendation_extension: value }, viewMotion);
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
}
