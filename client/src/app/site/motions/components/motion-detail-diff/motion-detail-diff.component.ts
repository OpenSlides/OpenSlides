import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { ViewMotion } from '../../models/view-motion';
import { ViewUnifiedChange, ViewUnifiedChangeType } from '../../models/view-unified-change';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MotionRepositoryService } from '../../services/motion-repository.service';
import { LineRange, ModificationType } from '../../services/diff.service';
import { ViewChangeReco } from '../../models/view-change-reco';
import { MatDialog } from '@angular/material';
import { ChangeRecommendationRepositoryService } from '../../services/change-recommendation-repository.service';
import {
    MotionChangeRecommendationComponent,
    MotionChangeRecommendationComponentData
} from '../motion-change-recommendation/motion-change-recommendation.component';

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
 *       (createChangeRecommendation)="createChangeRecommendation($event)"
 * ></os-motion-detail-diff>
 * ```
 */
@Component({
    selector: 'os-motion-detail-diff',
    templateUrl: './motion-detail-diff.component.html',
    styleUrls: ['./motion-detail-diff.component.scss']
})
export class MotionDetailDiffComponent implements AfterViewInit {
    @Input()
    public motion: ViewMotion;
    @Input()
    public changes: ViewUnifiedChange[];
    @Input()
    public scrollToChange: ViewUnifiedChange;

    @Output()
    public createChangeRecommendation: EventEmitter<LineRange> = new EventEmitter<LineRange>();

    public constructor(
        private sanitizer: DomSanitizer,
        private motionRepo: MotionRepositoryService,
        private recoRepo: ChangeRecommendationRepositoryService,
        private dialogService: MatDialog,
        private el: ElementRef
    ) {}

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

        if (lineRange.from > lineRange.to) {
            const msg = 'Inconsistent data.';
            return '<em style="color: red; font-weight: bold;">' + msg + '</em>';
        }
        if (lineRange.from === lineRange.to) {
            return '';
        }

        return this.motionRepo.extractMotionLineRange(this.motion.id, lineRange, true);
    }

    /**
     * Returns true if this change is colliding with another change
     * @param change
     */
    public hasCollissions(change: ViewUnifiedChange): boolean {
        // @TODO Implementation
        return false;
    }

    /**
     * Returns the diff string from the motion to the change
     * @param {ViewUnifiedChange} change
     */
    public getDiff(change: ViewUnifiedChange): SafeHtml {
        const html = this.motionRepo.getChangeDiff(this.motion, change);
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }

    /**
     * Returns the remainder text of the motion after the last change
     */
    public getTextRemainderAfterLastChange(): string {
        return this.motionRepo.getTextRemainderAfterLastChange(this.motion, this.changes);
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
     * Returns accepted, rejected or an empty string depending on the state of this change.
     *
     * @param change
     */
    public getAcceptanceValue(change: ViewUnifiedChange): string {
        if (change.isAccepted()) {
            return 'accepted';
        }
        if (change.isRejected()) {
            return 'rejected';
        }
        return '';
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
     * Gets the name of the modification type
     *
     * @param change
     */
    public getRecommendationTypeName(change: ViewChangeReco): string {
        switch (change.type) {
            case ModificationType.TYPE_REPLACEMENT:
                return 'Replacement';
            case ModificationType.TYPE_INSERTION:
                return 'Insertion';
            case ModificationType.TYPE_DELETION:
                return 'Deletion';
            default:
                return '@UNKNOWN@';
        }
    }

    /**
     * Sets a change recommendation to accepted or rejected.
     * The template has to make sure only to pass change recommendations to this method.
     *
     * @param {ViewChangeReco} change
     * @param {string} value
     */
    public setAcceptanceValue(change: ViewChangeReco, value: string): void {
        if (value === 'accepted') {
            this.recoRepo.setAccepted(change).subscribe(() => {}); // Subscribe to trigger HTTP request
        }
        if (value === 'rejected') {
            this.recoRepo.setRejected(change).subscribe(() => {}); // Subscribe to trigger HTTP request
        }
    }

    /**
     * Deletes a change recommendation.
     * The template has to make sure only to pass change recommendations to this method.
     *
     * @param {ViewChangeReco} reco
     * @param {MouseEvent} $event
     */
    public deleteChangeRecommendation(reco: ViewChangeReco, $event: MouseEvent): void {
        this.recoRepo.delete(reco).subscribe(() => {}); // Subscribe to trigger HTTP request
        $event.stopPropagation();
        $event.preventDefault();
    }

    /**
     * Edits a change recommendation.
     * The template has to make sure only to pass change recommendations to this method.
     *
     * @param {ViewChangeReco} reco
     * @param {MouseEvent} $event
     */
    public editChangeRecommendation(reco: ViewChangeReco, $event: MouseEvent): void {
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
            data: data
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
