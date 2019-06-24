import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewComponent } from 'app/site/base/base-view';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ChangeRecommendationRepositoryService } from 'app/core/repositories/motions/change-recommendation-repository.service';
import { DiffService, LineRange } from 'app/core/ui-services/diff.service';
import {
    MotionChangeRecommendationComponent,
    MotionChangeRecommendationComponentData
} from '../motion-change-recommendation/motion-change-recommendation.component';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewMotion, LineNumberingMode } from 'app/site/motions/models/view-motion';
import { ViewUnifiedChange, ViewUnifiedChangeType } from 'app/shared/models/motions/view-unified-change';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-motion-change-recommendation';
import { getRecommendationTypeName } from 'app/shared/utils/recommendation-type-names';

/**
 * This component displays the original motion text with the change blocks inside.
 * If the user is an administrator, each change block can be rejected.
 *
 * The line numbers are provided within the pre-rendered HTML, so we have to work with raw HTML and native HTML elements.
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
 *       (createChangeRecommendation)="createChangeRecommendation($event)"
 * ></os-motion-detail-diff>
 * ```
 */
@Component({
    selector: 'os-motion-detail-diff',
    templateUrl: './motion-detail-diff.component.html',
    styleUrls: ['./motion-detail-diff.component.scss']
})
export class MotionDetailDiffComponent extends BaseViewComponent implements AfterViewInit {
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

    @Output()
    public createChangeRecommendation: EventEmitter<LineRange> = new EventEmitter<LineRange>();

    /**
     * Indicates the maximum line length as defined in the configuration.
     */
    public lineLength: number;

    public preamble: string;

    /**
     * @param title
     * @param translate
     * @param matSnackBar
     * @param sanitizer
     * @param motionRepo
     * @param diff
     * @param recoRepo
     * @param dialogService
     * @param configService
     * @param el
     * @param promptService
     */
    public constructor(
        title: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        private sanitizer: DomSanitizer,
        private motionRepo: MotionRepositoryService,
        private diff: DiffService,
        private recoRepo: ChangeRecommendationRepositoryService,
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

        return this.motionRepo.extractMotionLineRange(
            this.motion.id,
            lineRange,
            true,
            this.lineLength,
            this.highlightedLine
        );
    }

    /**
     * Returns true if this change is colliding with another change
     * @param {ViewUnifiedChange} change
     * @param {ViewUnifiedChange[]} changes
     */
    public hasCollissions(change: ViewUnifiedChange, changes: ViewUnifiedChange[]): boolean {
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
     * Returns the diff string from the motion to the change
     * @param {ViewUnifiedChange} change
     */
    public getDiff(change: ViewUnifiedChange): SafeHtml {
        const html = this.diff.getChangeDiff(this.motion.text, change, this.lineLength, this.highlightedLine);
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }

    /**
     * Returns the remainder text of the motion after the last change
     */
    public getTextRemainderAfterLastChange(): string {
        if (!this.lineLength) {
            return ''; // @TODO This happens in the test case when the lineLength-variable is not set
        }
        return this.diff.getTextRemainderAfterLastChange(
            this.motion.text,
            this.changes,
            this.lineLength,
            this.highlightedLine
        );
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
        this.recoRepo.setInternal(change, internal).then(null, this.raiseError);
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
            this.recoRepo.delete(reco).then(null, this.raiseError);
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

        const data: MotionChangeRecommendationComponentData = {
            editChangeRecommendation: true,
            newChangeRecommendation: false,
            lineRange: {
                from: reco.getLineFrom(),
                to: reco.getLineTo()
            },
            changeRecommendation: reco
        };
        this.dialogService.open(MotionChangeRecommendationComponent, {
            height: '400px',
            width: '600px',
            data: data,
            disableClose: true
        });
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
