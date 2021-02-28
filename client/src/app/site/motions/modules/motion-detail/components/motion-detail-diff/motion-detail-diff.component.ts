import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ChangeRecommendationRepositoryService } from 'app/core/repositories/motions/change-recommendation-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DiffService, LineRange } from 'app/core/ui-services/diff.service';
import { LineNumberedString, LinenumberingService } from 'app/core/ui-services/linenumbering.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewUnifiedChange, ViewUnifiedChangeType } from 'app/shared/models/motions/view-unified-change';
import { mediumDialogSettings } from 'app/shared/utils/dialog-settings';
import { getRecommendationTypeName } from 'app/shared/utils/recommendation-type-names';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-motion-change-recommendation';
import { LineNumberingMode } from 'app/site/motions/motions.constants';
import {
    MotionChangeRecommendationDialogComponent,
    MotionChangeRecommendationDialogComponentData
} from '../motion-change-recommendation-dialog/motion-change-recommendation-dialog.component';
import {
    MotionTitleChangeRecommendationDialogComponent,
    MotionTitleChangeRecommendationDialogComponentData
} from '../motion-title-change-recommendation-dialog/motion-title-change-recommendation-dialog.component';
import { ViewMotionAmendedParagraph } from '../../../../models/view-motion-amended-paragraph';

/**
 * This component displays the original motion text with the change blocks inside.
 * If the user is an administrator, each change block can be rejected.
 *
 * The line numbers are provided within the pre-rendered HTML, so we have to work with raw HTML
 * and native HTML elements.
 *
 * It takes the styling from the parent component.
 *
 * ## Examples
 *
 * ```html
 *  <os-motion-detail-diff
 *       [motion]="motion"
 *       [changes]="changes"
 *       [scrollToChange]="change"
 *       [highlightedLine]="highlightedLine"
 *       [lineNumberingMode]="lnMode"
 *       [showAllAmendments]="showAllAmendments"
 *       (createChangeRecommendation)="createChangeRecommendation($event)"
 * ></os-motion-detail-diff>
 * ```
 */
@Component({
    selector: 'os-motion-detail-diff',
    templateUrl: './motion-detail-diff.component.html',
    styleUrls: ['./motion-detail-diff.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MotionDetailDiffComponent extends BaseViewComponentDirective implements AfterViewInit {
    /**
     * Get the {@link getRecommendationTypeName}-Function from Utils
     */
    public getRecommendationTypeName = getRecommendationTypeName;

    @Input()
    public motion: ViewMotion;
    @Input()
    public changes: ViewUnifiedChange[];
    @Input()
    public scrollToChange: ViewUnifiedChange;
    @Input()
    public highlightedLine: number;
    @Input()
    public lineNumberingMode: LineNumberingMode;
    @Input()
    public showAllAmendments: boolean;

    @Output()
    public createChangeRecommendation: EventEmitter<LineRange> = new EventEmitter<LineRange>();

    /**
     * Indicates the maximum line length as defined in the configuration.
     */
    public lineLength: number;

    public preamble: string;

    public get showPreamble(): boolean {
        return this.motion.showPreamble;
    }

    /**
     * @param title
     * @param translate
     * @param matSnackBar
     * @param diff
     * @param lineNumbering
     * @param recoRepo
     * @param motionRepo
     * @param dialogService
     * @param configService
     * @param el
     * @param promptService
     */
    public constructor(
        title: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        private diff: DiffService,
        private lineNumbering: LinenumberingService,
        private recoRepo: ChangeRecommendationRepositoryService,
        private motionRepo: MotionRepositoryService,
        private dialogService: MatDialog,
        private configService: ConfigService,
        private el: ElementRef,
        private promptService: PromptService
    ) {
        super(title, translate, matSnackBar);
        this.configService.get<number>('motions_line_length').subscribe(lineLength => (this.lineLength = lineLength));
        this.configService.get<string>('motions_preamble').subscribe(preamble => (this.preamble = preamble));
    }

    /**
     * Returns the part of this motion between two change objects
     * @param {ViewUnifiedChange} change1
     * @param {ViewUnifiedChange} change2
     */
    public getTextBetweenChanges(change1: ViewUnifiedChange, change2: ViewUnifiedChange): string {
        // @TODO Highlighting
        const lineRange: LineRange = {
            from: change1 ? change1.getLineTo() : 1,
            to: change2 ? change2.getLineFrom() : null
        };

        if (lineRange.from >= lineRange.to) {
            // Empty space between two amendments, or between colliding amendments
            return '';
        }

        let baseText: LineNumberedString;
        if (this.motion.isParagraphBasedAmendment()) {
            try {
                baseText = this.motionRepo
                    .getAllAmendmentParagraphsWithOriginalLineNumbers(this.motion, this.lineLength, true)
                    .join('\n');
            } catch (e) {
                console.error(e);
                return '';
            }
        } else {
            baseText = this.lineNumbering.insertLineNumbers(this.motion.text, this.lineLength);
        }

        return this.diff.extractMotionLineRange(baseText, lineRange, true, this.lineLength, this.highlightedLine);
    }

    /**
     * Returns true if this change is colliding with another change
     * @param {ViewUnifiedChange} change
     * @param {ViewUnifiedChange[]} changes
     */
    public hasCollissions(change: ViewUnifiedChange, changes: ViewUnifiedChange[]): boolean {
        return this.motionRepo.changeHasCollissions(change, changes);
    }

    /**
     * Returns the diff string from the motion to the change
     * @param {ViewUnifiedChange} change
     */
    public getDiff(change: ViewUnifiedChange): string {
        let motionHtml: string;
        if (this.motion.isParagraphBasedAmendment()) {
            const parentMotion = this.motionRepo.getViewModel(this.motion.parent_id);
            motionHtml = parentMotion.text;
        } else {
            motionHtml = this.motion.text;
        }
        const baseHtml = this.lineNumbering.insertLineNumbers(motionHtml, this.lineLength);
        return this.diff.getChangeDiff(baseHtml, change, this.lineLength, this.highlightedLine);
    }

    /**
     * Returns the remainder text of the motion after the last change
     */
    public getTextRemainderAfterLastChange(): string {
        if (!this.lineLength) {
            return ''; // @TODO This happens in the test case when the lineLength-variable is not set
        }
        let baseText: LineNumberedString;
        if (this.motion.isParagraphBasedAmendment()) {
            try {
                baseText = this.motionRepo
                    .getAllAmendmentParagraphsWithOriginalLineNumbers(this.motion, this.lineLength, true)
                    .join('\n');
            } catch (e) {
                console.error(e);
                return '';
            }
        } else {
            baseText = this.lineNumbering.insertLineNumbers(this.motion.text, this.lineLength);
        }
        return this.diff.getTextRemainderAfterLastChange(baseText, this.changes, this.lineLength, this.highlightedLine);
    }

    /**
     * If only one line is affected, the line number is returned; otherwise, a string like [line] "1 - 5"
     *
     * @param {ViewUnifiedChange} change
     * @returns string
     */
    public formatLineRange(change: ViewUnifiedChange): string {
        if (change.getLineFrom() < change.getLineTo() - 1) {
            return change.getLineFrom().toString(10) + ' - ' + (change.getLineTo() - 1).toString(10);
        } else {
            return change.getLineFrom().toString(10);
        }
    }

    /**
     * Returns true if the change is a Change Recommendation
     *
     * @param {ViewUnifiedChange} change
     */
    public isRecommendation(change: ViewUnifiedChange): boolean {
        return change.getChangeType() === ViewUnifiedChangeType.TYPE_CHANGE_RECOMMENDATION;
    }

    /**
     * Returns true if no line numbers are to be shown.
     *
     * @returns whether there are line numbers at all
     */
    public isLineNumberingNone(): boolean {
        return this.lineNumberingMode === LineNumberingMode.None;
    }

    /**
     * Returns true if the line numbers are to be shown within the text with no line breaks.
     *
     * @returns whether the line numberings are inside
     */
    public isLineNumberingInline(): boolean {
        return this.lineNumberingMode === LineNumberingMode.Inside;
    }

    /**
     * Returns true if the line numbers are to be shown to the left of the text.
     *
     * @returns whether the line numberings are outside
     */
    public isLineNumberingOutside(): boolean {
        return this.lineNumberingMode === LineNumberingMode.Outside;
    }

    /**
     * Returns true if the change is an Amendment
     *
     * @param {ViewUnifiedChange} change
     */
    public isAmendment(change: ViewUnifiedChange): boolean {
        return change.getChangeType() === ViewUnifiedChangeType.TYPE_AMENDMENT;
    }

    /**
     * Returns true if the change is a Change Recommendation
     *
     * @param {ViewUnifiedChange} change
     */
    public isChangeRecommendation(change: ViewUnifiedChange): boolean {
        return change.getChangeType() === ViewUnifiedChangeType.TYPE_CHANGE_RECOMMENDATION;
    }

    public getAllTextChangingObjects(): ViewUnifiedChange[] {
        return this.changes.filter((obj: ViewUnifiedChange) => !obj.isTitleChange());
    }

    public getTitleChangingObject(): ViewUnifiedChange {
        return this.changes.find((obj: ViewUnifiedChange) => obj.isTitleChange());
    }

    public getFormattedTitleDiff(): string {
        const change = this.getTitleChangingObject();
        return this.recoRepo.getTitleChangesAsDiff(this.motion.title, change);
    }

    /**
     * Sets a change recommendation to accepted or rejected.
     * The template has to make sure only to pass change recommendations to this method.
     *
     * @param {ViewMotionChangeRecommendation} change
     * @param {string} value
     */
    public async setAcceptanceValue(change: ViewMotionChangeRecommendation, value: string): Promise<void> {
        try {
            if (value === 'accepted') {
                await this.recoRepo.setAccepted(change);
            }
            if (value === 'rejected') {
                await this.recoRepo.setRejected(change);
            }
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * Sets if a change recommendation is internal or not
     *
     * @param {ViewMotionChangeRecommendation} change
     * @param {boolean} internal
     */
    public setInternal(change: ViewMotionChangeRecommendation, internal: boolean): void {
        this.recoRepo.setInternal(change, internal).catch(this.raiseError);
    }

    /**
     * Deletes a change recommendation.
     * The template has to make sure only to pass change recommendations to this method.
     *
     * @param {ViewMotionChangeRecommendation} reco
     * @param {MouseEvent} $event
     */
    public async deleteChangeRecommendation(reco: ViewMotionChangeRecommendation, $event: MouseEvent): Promise<void> {
        $event.stopPropagation();
        $event.preventDefault();
        const title = this.translate.instant('Are you sure you want to delete this change recommendation?');
        if (await this.promptService.open(title)) {
            this.recoRepo.delete(reco).catch(this.raiseError);
        }
    }

    /**
     * Edits a change recommendation.
     * The template has to make sure only to pass change recommendations to this method.
     *
     * @param {ViewMotionChangeRecommendation} reco
     * @param {MouseEvent} $event
     */
    public editChangeRecommendation(reco: ViewMotionChangeRecommendation, $event: MouseEvent): void {
        $event.stopPropagation();
        $event.preventDefault();

        const data: MotionChangeRecommendationDialogComponentData = {
            editChangeRecommendation: true,
            newChangeRecommendation: false,
            lineRange: {
                from: reco.getLineFrom(),
                to: reco.getLineTo()
            },
            changeRecommendation: reco
        };
        this.dialogService.open(MotionChangeRecommendationDialogComponent, {
            ...mediumDialogSettings,
            data: data
        });
    }

    public editTitleChangeRecommendation(reco: ViewMotionChangeRecommendation, $event: MouseEvent): void {
        $event.stopPropagation();
        $event.preventDefault();

        const data: MotionTitleChangeRecommendationDialogComponentData = {
            editChangeRecommendation: true,
            newChangeRecommendation: false,
            changeRecommendation: reco
        };
        this.dialogService.open(MotionTitleChangeRecommendationDialogComponent, {
            ...mediumDialogSettings,
            data: data
        });
    }

    public setAmendmentState(change: ViewUnifiedChange, state: number): void {
        this.motionRepo.setState((change as ViewMotionAmendedParagraph).amendment, state).catch(this.raiseError);
    }

    /**
     * Scrolls to the native element specified by [scrollToChange]
     */
    private scrollToChangeElement(change: ViewUnifiedChange): void {
        const element = <HTMLElement>this.el.nativeElement;
        const target = element.querySelector('[data-change-id="' + change.getChangeId() + '"]');
        target.scrollIntoView({ behavior: 'smooth' });
    }

    public scrollToChangeClicked(change: ViewUnifiedChange, $event: MouseEvent): void {
        $event.preventDefault();
        $event.stopPropagation();
        this.scrollToChangeElement(change);
    }

    /**
     * Called from motion-detail-original-change-recommendations -> delegate to parent
     *
     * @param {LineRange} event
     */
    public onCreateChangeRecommendation(event: LineRange): void {
        this.createChangeRecommendation.emit(event);
    }

    public ngAfterViewInit(): void {
        if (this.scrollToChange) {
            window.setTimeout(() => {
                this.scrollToChangeElement(this.scrollToChange);
            }, 50);
        }
    }
}
