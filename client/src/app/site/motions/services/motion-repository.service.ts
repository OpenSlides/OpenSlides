import { Injectable } from '@angular/core';

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
import { DiffService, LineRange, ModificationType } from './diff.service';
import { ViewChangeReco } from '../models/view-change-reco';
import { MotionChangeReco } from '../../../shared/models/motions/motion-change-reco';
import { ViewUnifiedChange } from '../models/view-unified-change';
import { Identifiable } from '../../../shared/models/base/identifiable';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';
import { HttpService } from 'app/core/services/http.service';
import { ConfigService } from 'app/core/services/config.service';
import { Observable } from 'rxjs';
import { Item } from 'app/shared/models/agenda/item';

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
     * @param {DataStoreService} DS
     * @param {DataSendService} dataSend
     * @param {LinenumberingService} lineNumbering
     * @param {DiffService} diff
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringModelMapperService,
        private dataSend: DataSendService,
        private httpService: HttpService,
        private configService: ConfigService,
        private readonly lineNumbering: LinenumberingService,
        private readonly diff: DiffService
    ) {
        super(DS, mapperService, Motion, [Category, User, Workflow, Item]);
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
        let state: WorkflowState = null;
        if (workflow) {
            state = workflow.getStateById(motion.state_id);
        }
        return new ViewMotion(motion, category, submitters, supporters, workflow, state, item);
    }

    /**
     * Creates a motion
     * Creates a (real) motion with patched data and delegate it
     * to the {@link DataSendService}
     *
     * @param update the form data containing the update values
     * @param viewMotion The View Motion. If not present, a new motion will be created
     * TODO: Remove the viewMotion and make it actually distignuishable from save()
     */
    public async create(motion: Motion): Promise<Identifiable> {
        if (!motion.supporters_id) {
            delete motion.supporters_id;
        }
        return await this.dataSend.createModel(motion);
    }

    /**
     * updates a motion
     *
     * Creates a (real) motion with patched data and delegate it
     * to the {@link DataSendService}
     *
     * @param update the form data containing the update values
     * @param viewMotion The View Motion. If not present, a new motion will be created
     */
    public async update(update: Partial<Motion>, viewMotion: ViewMotion): Promise<void> {
        const motion = viewMotion.motion;
        motion.patchValues(update);
        await this.dataSend.partialUpdateModel(motion);
    }

    /**
     * Deleting a motion.
     *
     * Extract the motion out of the motionView and delegate
     * to {@link DataSendService}
     * @param viewMotion
     */
    public async delete(viewMotion: ViewMotion): Promise<void> {
        await this.dataSend.deleteModel(viewMotion.motion);
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
     * @param stateId the number that indicates the state
     */
    public async setRecommenderState(viewMotion: ViewMotion, stateId: number): Promise<void> {
        const restPath = `/rest/motions/motion/${viewMotion.id}/set_recommendation/`;
        await this.httpService.put(restPath, { recommendation: stateId });
    }

    /**
     * Returns the motions_recommendations_by observable from the config service
     *
     * @return an observable that contains the motions "Recommended by" string
     */
    public getRecommenderObservable(): Observable<string> {
        return this.configService.get('motions_recommendations_by');
    }

    /**
     * Sorts motions for the call list by the given list of ids (as identifiables with
     * the format `{id: <id>}`).
     * @param motionIds all motion ids in the new order.
     */
    public async sortMotions(motionIds: Identifiable[]): Promise<void> {
        const url = '/rest/motions/motion/sort/';
        await this.httpService.post(url, { nodes: motionIds });
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
}
