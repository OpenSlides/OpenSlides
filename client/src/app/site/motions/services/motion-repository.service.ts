import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

import { DataSendService } from '../../../core/services/data-send.service';
import { Motion } from '../../../shared/models/motions/motion';
import { User } from '../../../shared/models/users/user';
import { Category } from '../../../shared/models/motions/category';
import { Workflow } from '../../../shared/models/motions/workflow';
import { WorkflowState } from '../../../shared/models/motions/workflow-state';
import { ChangeRecoMode, ViewMotion } from '../models/view-motion';
import { BaseRepository } from '../../base/base-repository';
import { DataStoreService } from '../../../core/services/data-store.service';
import { LinenumberingService } from './linenumbering.service';
import { DiffLinesInParagraph, DiffService, LineRange, ModificationType } from './diff.service';
import { ViewChangeReco } from '../models/view-change-reco';
import { MotionChangeReco } from '../../../shared/models/motions/motion-change-reco';
import { ViewUnifiedChange } from '../models/view-unified-change';
import { ViewStatuteParagraph } from '../models/view-statute-paragraph';
import { Identifiable } from '../../../shared/models/base/identifiable';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';
import { HttpService } from 'app/core/services/http.service';
import { Item } from 'app/shared/models/agenda/item';
import { OSTreeSortEvent } from 'app/shared/components/sorting-tree/sorting-tree.component';
import { TreeService } from 'app/core/services/tree.service';
import { ViewMotionAmendedParagraph } from '../models/view-motion-amended-paragraph';
import { CreateMotion } from '../models/create-motion';
import { MotionBlock } from 'app/shared/models/motions/motion-block';

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
export class MotionRepositoryService extends BaseRepository<ViewMotion, Motion> {
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
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringModelMapperService,
        private dataSend: DataSendService,
        private httpService: HttpService,
        private readonly lineNumbering: LinenumberingService,
        private readonly diff: DiffService,
        private treeService: TreeService
    ) {
        super(DS, mapperService, Motion, [Category, User, Workflow, Item, MotionBlock]);
    }

    /**
     * Converts a motion to a ViewMotion and adds it to the store.
     *
     * Foreign references of the motion will be resolved (e.g submitters to users)
     * Expandable to all (server side) changes that might occur on the motion object.
     *
     * @param motion blank motion domain object
     */
    protected createViewModel(motion: Motion): ViewMotion {
        const category = this.DS.get(Category, motion.category_id);
        const submitters = this.DS.getMany(User, motion.submitterIds);
        const supporters = this.DS.getMany(User, motion.supporters_id);
        const workflow = this.DS.get(Workflow, motion.workflow_id);
        const item = this.DS.get(Item, motion.agenda_item_id);
        const block = this.DS.get(MotionBlock, motion.motion_block_id);
        let state: WorkflowState = null;
        if (workflow) {
            state = workflow.getStateById(motion.state_id);
        }
        return new ViewMotion(motion, category, submitters, supporters, workflow, state, item, block);
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
     * Sends the changed nodes to the server.
     *
     * @param data The reordered data from the sorting
     */
    public async sortMotions(data: OSTreeSortEvent<ViewMotion>): Promise<void> {
        const url = '/rest/motions/motion/sort/';
        await this.httpService.post(url, data);
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
                    return this.diff.getTextWithChanges(targetMotion, changes, lineLength, highlightLine);
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
                                true
                            );
                        } else if (changes[idx - 1].getLineTo() < change.getLineFrom()) {
                            text += this.extractMotionLineRange(
                                id,
                                {
                                    from: changes[idx - 1].getLineTo(),
                                    to: change.getLineFrom()
                                },
                                true
                            );
                        }
                        text += this.getChangeDiff(targetMotion, change, highlightLine);
                    });
                    text += this.getTextRemainderAfterLastChange(targetMotion, changes, highlightLine);
                    return text;
                case ChangeRecoMode.Final:
                    const appliedChanges: ViewUnifiedChange[] = changes.filter(change => change.isAccepted());
                    return this.diff.getTextWithChanges(targetMotion, appliedChanges, lineLength, highlightLine);
                default:
                    console.error('unrecognized ChangeRecoMode option');
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
        let diffHtml = this.diff.diff(origParagraph.text, amendment.text);
        diffHtml = this.lineNumbering.insertLineBreaksWithoutNumbers(diffHtml, lineLength, true);
        return diffHtml;
    }

    /**
     * Extracts a renderable HTML string representing the given line number range of this motion
     *
     * @param {number} id
     * @param {LineRange} lineRange
     * @param {boolean} lineNumbers - weather to add line numbers to the returned HTML string
     */
    public extractMotionLineRange(id: number, lineRange: LineRange, lineNumbers: boolean): string {
        // @TODO flexible line numbers
        const origHtml = this.formatMotion(id, ChangeRecoMode.Original, [], 80);
        const extracted = this.diff.extractRangeByLineNumbers(origHtml, lineRange.from, lineRange.to);
        let html =
            extracted.outerContextStart +
            extracted.innerContextStart +
            extracted.html +
            extracted.innerContextEnd +
            extracted.outerContextEnd;
        if (lineNumbers) {
            html = this.lineNumbering.insertLineNumbers(html, 80, null, null, lineRange.from);
        }
        return html;
    }

    /**
     * Returns the remainder text of the motion after the last change
     *
     * @param {ViewMotion} motion
     * @param {ViewUnifiedChange[]} changes
     * @param {number} highlight
     * @returns {string}
     */
    public getTextRemainderAfterLastChange(
        motion: ViewMotion,
        changes: ViewUnifiedChange[],
        highlight?: number
    ): string {
        let maxLine = 0;
        changes.forEach((change: ViewUnifiedChange) => {
            if (change.getLineTo() > maxLine) {
                maxLine = change.getLineTo();
            }
        }, 0);

        const numberedHtml = this.lineNumbering.insertLineNumbers(motion.text, motion.lineLength);
        let data;

        try {
            data = this.diff.extractRangeByLineNumbers(numberedHtml, maxLine, null);
        } catch (e) {
            // This only happens (as far as we know) when the motion text has been altered (shortened)
            // without modifying the change recommendations accordingly.
            // That's a pretty serious inconsistency that should not happen at all,
            // we're just doing some basic damage control here.
            const msg =
                'Inconsistent data. A change recommendation is probably referring to a non-existant line number.';
            return '<em style="color: red; font-weight: bold;">' + msg + '</em>';
        }

        let html;
        if (data.html !== '') {
            // Add "merge-before"-css-class if the first line begins in the middle of a paragraph. Used for PDF.
            html =
                this.diff.addCSSClassToFirstTag(data.outerContextStart + data.innerContextStart, 'merge-before') +
                data.html +
                data.innerContextEnd +
                data.outerContextEnd;
            html = this.lineNumbering.insertLineNumbers(html, motion.lineLength, highlight, null, maxLine);
        } else {
            // Prevents empty lines at the end of the motion
            html = '';
        }
        return html;
    }

    /**
     * Creates a {@link ViewChangeReco} object based on the motion ID and the given lange range.
     * This object is not saved yet and does not yet have any changed HTML. It's meant to populate the UI form.
     *
     * @param {number} motionId
     * @param {LineRange} lineRange
     */
    public createChangeRecommendationTemplate(motionId: number, lineRange: LineRange): ViewChangeReco {
        const changeReco = new MotionChangeReco();
        changeReco.line_from = lineRange.from;
        changeReco.line_to = lineRange.to;
        changeReco.type = ModificationType.TYPE_REPLACEMENT;
        changeReco.text = this.extractMotionLineRange(motionId, lineRange, false);
        changeReco.rejected = false;
        changeReco.motion_id = motionId;

        return new ViewChangeReco(changeReco);
    }

    /**
     * Returns the HTML with the changes, optionally with a highlighted line.
     * The original motion needs to be provided.
     *
     * @param {ViewMotion} motion
     * @param {ViewUnifiedChange} change
     * @param {number} highlight
     * @returns {string}
     */
    public getChangeDiff(motion: ViewMotion, change: ViewUnifiedChange, highlight?: number): string {
        const lineLength = motion.lineLength,
            html = this.lineNumbering.insertLineNumbers(motion.text, lineLength);

        let data, oldText;

        try {
            data = this.diff.extractRangeByLineNumbers(html, change.getLineFrom(), change.getLineTo());
            oldText =
                data.outerContextStart +
                data.innerContextStart +
                data.html +
                data.innerContextEnd +
                data.outerContextEnd;
        } catch (e) {
            // This only happens (as far as we know) when the motion text has been altered (shortened)
            // without modifying the change recommendations accordingly.
            // That's a pretty serious inconsistency that should not happen at all,
            // we're just doing some basic damage control here.
            const msg =
                'Inconsistent data. A change recommendation is probably referring to a non-existant line number.';
            return '<em style="color: red; font-weight: bold;">' + msg + '</em>';
        }

        oldText = this.lineNumbering.insertLineNumbers(oldText, lineLength, null, null, change.getLineFrom());
        let diff = this.diff.diff(oldText, change.getChangeNewText());

        // If an insertion makes the line longer than the line length limit, we need two line breaking runs:
        // - First, for the official line numbers, ignoring insertions (that's been done some lines before)
        // - Second, another one to prevent the displayed including insertions to exceed the page width
        diff = this.lineNumbering.insertLineBreaksWithoutNumbers(diff, lineLength, true);

        if (highlight > 0) {
            diff = this.lineNumbering.highlightLine(diff, highlight);
        }

        const origBeginning = data.outerContextStart + data.innerContextStart;
        if (diff.toLowerCase().indexOf(origBeginning.toLowerCase()) === 0) {
            // Add "merge-before"-css-class if the first line begins in the middle of a paragraph. Used for PDF.
            diff =
                this.diff.addCSSClassToFirstTag(origBeginning, 'merge-before') + diff.substring(origBeginning.length);
        }

        return diff;
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
     * @returns {string[]}
     */
    public getTextParagraphs(motion: ViewMotion, lineBreaks: boolean): string[] {
        if (!motion) {
            return [];
        }
        let html = motion.text;
        if (lineBreaks) {
            const lineLength = motion.lineLength;
            html = this.lineNumbering.insertLineNumbers(html, lineLength);
        }
        return this.lineNumbering.splitToParagraphs(html);
    }

    /**
     * Returns all paragraphs that are affected by the given amendment in diff-format
     *
     * @param {ViewMotion} amendment
     * @returns {DiffLinesInParagraph}
     */
    public getAmendedParagraphs(amendment: ViewMotion): DiffLinesInParagraph[] {
        const motion = this.getAmendmentBaseMotion(amendment);
        const baseParagraphs = this.getTextParagraphs(motion, true);
        const lineLength = amendment.lineLength;

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
     * @returns {ViewMotionAmendedParagraph[]}
     */
    public getAmendmentAmendedParagraphs(amendment: ViewMotion): ViewMotionAmendedParagraph[] {
        const motion = this.getAmendmentBaseMotion(amendment);
        const baseParagraphs = this.getTextParagraphs(motion, true);
        const lineLength = amendment.lineLength;

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
}
