import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    Renderer2,
    SimpleChanges
} from '@angular/core';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { LineRange, ModificationType } from 'app/core/ui-services/diff.service';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-motion-change-recommendation';

/**
 * This component displays either the original motion text or the original amendment diff text
 * with annotated change commendations and a method to create new change recommendations
 * from the line numbers to the left of the text.
 * It's called from motion-details for displaying the whole motion text as well as from the
 * motion's or amendment's diff view to show the unchanged parts of the motion.
 *
 * The line numbers are provided within the pre-rendered HTML, so we have to work with raw HTML
 * and native HTML elements.
 *
 * It takes the styling from the parent component.
 *
 * Special hints regarding amendments:
 * When used for paragraph-based amendments, this component is embedded once for each paragraph. Hence,
 * not all changeRecommendations provided are relevant for this paragraph (as we put the decision about
 * which changeRecommendations are relevant in this component, not the caller).
 * TODO: Right now, only change recommendations affecting only one paragraph are supported
 *
 * ## Examples
 *
 * ```html
 *  <os-motion-detail-original-change-recommendations
 *       [html]="getFormattedText()"
 *       [changeRecommendations]="changeRecommendations"
 *       (createChangeRecommendation)="createChangeRecommendation($event)"
 *       (gotoChangeRecommendation)="gotoChangeRecommendation($event)"
 * ></os-motion-detail-original-change-recommendations>
 * ```
 */
@Component({
    selector: 'os-motion-detail-original-change-recommendations',
    templateUrl: './motion-detail-original-change-recommendations.component.html',
    styleUrls: ['./motion-detail-original-change-recommendations.component.scss']
})
export class MotionDetailOriginalChangeRecommendationsComponent implements OnInit, OnChanges {
    private element: Element;
    private selectedFrom: number = null;

    @Output()
    public createChangeRecommendation: EventEmitter<LineRange> = new EventEmitter<LineRange>();

    @Output()
    public gotoChangeRecommendation: EventEmitter<ViewMotionChangeRecommendation> = new EventEmitter<
        ViewMotionChangeRecommendation
    >(); // prettier-ignore

    @Input()
    public html: string;

    @Input()
    public changeRecommendations: ViewMotionChangeRecommendation[];

    public showChangeRecommendations = false;

    public can_manage = false;

    // Calculated from the embedded line numbers after the text has been set.
    // Hint: this numbering refers to the actual lines, not the line number markers;
    // hence, if maxLineNo === 10, line no. 10 is still visible.
    // This is semantically different from the diff algorithms.
    private minLineNo: number = null;
    private maxLineNo: number = null;

    /**
     * @param {Renderer2} renderer
     * @param {ElementRef} el
     * @param {ChangeDetectorRef} cd
     * @param {OperatorService} operator
     */
    public constructor(
        private renderer: Renderer2,
        private el: ElementRef,
        private cd: ChangeDetectorRef,
        private operator: OperatorService
    ) {
        this.operator.getUserObservable().subscribe(this.onPermissionsChanged.bind(this));
    }

    /**
     * Re-creates
     */
    private update(): void {
        if (!this.element) {
            // Not yet initialized
            return;
        }
        this.element.innerHTML = this.html;

        this.startCreating();
    }

    /**
     * The permissions of the user have changed -> activate / deactivate editing functionality
     */
    private onPermissionsChanged(): void {
        if (this.operator.hasPerms(Permission.motionsCanManage)) {
            this.can_manage = true;
            if (this.selectedFrom === null) {
                this.startCreating();
            }
        } else {
            this.can_manage = false;
            this.selectedFrom = null;
            if (this.element) {
                Array.from(this.element.querySelectorAll('.os-line-number')).forEach((lineNumber: Element) => {
                    lineNumber.classList.remove('selectable');
                    lineNumber.classList.remove('selected');
                });
            }
        }
    }

    public getTextChangeRecommendations(): ViewMotionChangeRecommendation[] {
        return this.changeRecommendations
            .filter(reco => !reco.isTitleChange())
            .filter(reco => reco.line_from >= this.minLineNo && reco.line_from <= this.maxLineNo);
    }

    private setLineNumberCache(): void {
        Array.from(this.element.querySelectorAll('.os-line-number')).forEach((lineNumberEl: Element) => {
            const lineNumber = parseInt(lineNumberEl.getAttribute('data-line-number'), 10);
            if (this.minLineNo === null || lineNumber < this.minLineNo) {
                this.minLineNo = lineNumber;
            }
            if (this.maxLineNo === null || lineNumber > this.maxLineNo) {
                this.maxLineNo = lineNumber;
            }
        });
    }

    /**
     * Returns an array with all line numbers that are currently affected by a change recommendation
     * and therefor not subject to further changes
     */
    private getAffectedLineNumbers(): number[] {
        const affectedLines = [];
        this.changeRecommendations.forEach((change: ViewMotionChangeRecommendation) => {
            if (change.isTitleChange()) {
                return;
            }
            for (let j = change.line_from; j < change.line_to; j++) {
                affectedLines.push(j);
            }
        });
        return affectedLines;
    }

    /**
     * Resetting the selection. All selected lines are unselected, and the selectable lines are marked as such
     */
    private startCreating(): void {
        if (!this.can_manage || !this.element) {
            return;
        }

        const alreadyAffectedLines = this.getAffectedLineNumbers();
        Array.from(this.element.querySelectorAll('.os-line-number')).forEach((lineNumber: Element) => {
            lineNumber.classList.remove('selected');
            if (alreadyAffectedLines.indexOf(parseInt(lineNumber.getAttribute('data-line-number'), 10)) === -1) {
                lineNumber.classList.add('selectable');
            } else {
                lineNumber.classList.remove('selectable');
            }
        });
    }

    /**
     * A line number has been clicked - either to start the selection or to finish it.
     *
     * @param lineNumber
     */
    private clickedLineNumber(lineNumber: number): void {
        if (this.selectedFrom === null) {
            this.selectedFrom = lineNumber;
        } else {
            if (lineNumber > this.selectedFrom) {
                this.createChangeRecommendation.emit({
                    from: this.selectedFrom,
                    to: lineNumber + 1
                });
            } else {
                this.createChangeRecommendation.emit({
                    from: lineNumber,
                    to: this.selectedFrom + 1
                });
            }
            this.selectedFrom = null;
            this.startCreating();
        }
    }

    /**
     * A line number is hovered. If we are in the process of selecting a line range and the hovered line is selectable,
     * the plus sign is shown for this line and all lines between the first selected line.
     *
     * @param lineNumberHovered
     */
    private hoverLineNumber(lineNumberHovered: number): void {
        if (this.selectedFrom === null) {
            return;
        }
        Array.from(this.element.querySelectorAll('.os-line-number')).forEach((lineNumber: Element) => {
            const line = parseInt(lineNumber.getAttribute('data-line-number'), 10);
            if (
                (line >= this.selectedFrom && line <= lineNumberHovered) ||
                (line >= lineNumberHovered && line <= this.selectedFrom)
            ) {
                lineNumber.classList.add('selected');
            } else {
                lineNumber.classList.remove('selected');
            }
        });
    }

    /**
     * Style for the change recommendation list
     * @param reco
     */
    public calcRecoTop(reco: ViewMotionChangeRecommendation): string {
        const from = <HTMLElement>(
            this.element.querySelector('.os-line-number.line-number-' + reco.line_from.toString(10))
        );
        return from.offsetTop.toString() + 'px';
    }

    /**
     * Style for the change recommendation list
     * @param reco
     */
    public calcRecoHeight(reco: ViewMotionChangeRecommendation): string {
        const from = <HTMLElement>(
            this.element.querySelector('.os-line-number.line-number-' + reco.line_from.toString(10))
        );
        const to = <HTMLElement>this.element.querySelector('.os-line-number.line-number-' + reco.line_to.toString(10));
        if (to) {
            return (to.offsetTop - from.offsetTop).toString() + 'px';
        } else {
            // Last line - lets assume a realistic value
            return '20px';
        }
    }

    /**
     * CSS-Class for the change recommendation list
     * @param reco
     */
    public recoIsInsertion(reco: ViewMotionChangeRecommendation): boolean {
        return reco.type === ModificationType.TYPE_INSERTION;
    }

    /**
     * CSS-Class for the change recommendation list
     * @param reco
     */
    public recoIsDeletion(reco: ViewMotionChangeRecommendation): boolean {
        return reco.type === ModificationType.TYPE_DELETION;
    }

    /**
     * CSS-Class for the change recommendation list
     * @param reco
     */
    public recoIsReplacement(reco: ViewMotionChangeRecommendation): boolean {
        return reco.type === ModificationType.TYPE_REPLACEMENT;
    }

    /**
     * Trigger the `gotoChangeRecommendation`-event
     * @param reco
     */
    public gotoReco(reco: ViewMotionChangeRecommendation): void {
        this.gotoChangeRecommendation.emit(reco);
    }

    /**
     * Adding the event listeners: clicking on plus signs next to line numbers
     * and the hover-event next to the line numbers
     */
    public ngOnInit(): void {
        const nativeElement = <Element>this.el.nativeElement;
        this.element = <Element>nativeElement.querySelector('.text');

        this.renderer.listen(this.el.nativeElement, 'click', (ev: MouseEvent) => {
            const element = <Element>ev.target;
            if (element.classList.contains('os-line-number') && element.classList.contains('selectable')) {
                this.clickedLineNumber(parseInt(element.getAttribute('data-line-number'), 10));
            }
        });

        this.renderer.listen(this.el.nativeElement, 'mouseover', (ev: MouseEvent) => {
            const element = <Element>ev.target;
            if (element.classList.contains('os-line-number') && element.classList.contains('selectable')) {
                this.hoverLineNumber(parseInt(element.getAttribute('data-line-number'), 10));
            }
        });

        this.update();

        // The positioning of the change recommendations depends on the rendered HTML
        // If we show it right away, there will be nasty Angular warnings about changed values, as the position
        // is changing while the DOM updates
        window.setTimeout(() => {
            this.setLineNumberCache();
            this.showChangeRecommendations = true;
            this.cd.detectChanges();
        }, 1);
    }

    /**
     * @param changes
     */
    public ngOnChanges(changes: SimpleChanges): void {
        this.update();
    }
}
