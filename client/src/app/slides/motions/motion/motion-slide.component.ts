import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { MotionSlideData, MotionSlideDataAmendment } from './motion-slide-data';
import { ChangeRecoMode, LineNumberingMode } from '../../../site/motions/models/view-motion';
import { DiffLinesInParagraph, DiffService, LineRange } from '../../../core/ui-services/diff.service';
import { LinenumberingService } from '../../../core/ui-services/linenumbering.service';
import { ViewUnifiedChange } from '../../../shared/models/motions/view-unified-change';
import { MotionSlideObjChangeReco } from './motion-slide-obj-change-reco';
import { SlideData } from '../../../core/core-services/projector-data.service';
import { MotionSlideObjAmendmentParagraph } from './motion-slide-obj-amendment-paragraph';

@Component({
    selector: 'os-motion-slide',
    templateUrl: './motion-slide.component.html',
    styleUrls: ['./motion-slide.component.scss']
})
export class MotionSlideComponent extends BaseSlideComponent<MotionSlideData> {
    /**
     * Indicates the LineNumberingMode Mode.
     */
    public lnMode: LineNumberingMode;

    /**
     * Indicates the Change reco Mode.
     */
    public crMode: ChangeRecoMode;

    /**
     * Indicates the maximum line length as defined in the configuration.
     */
    public lineLength: number;

    /**
     * Indicates the currently highlighted line, if any.
     * @TODO Read value from the backend
     */
    public highlightedLine: number;

    /**
     * Value of the config variable `motions_preamble`
     */
    public preamble: string;

    /**
     * All change recommendations AND amendments, sorted by line number.
     */
    public allChangingObjects: ViewUnifiedChange[];

    private _data: SlideData<MotionSlideData>;

    @Input()
    public set data(value: SlideData<MotionSlideData>) {
        this._data = value;
        this.lnMode = value.data.line_numbering_mode;
        this.lineLength = value.data.line_length;
        this.preamble = value.data.preamble;
        this.crMode = value.element.mode || 'original';
        console.log(this.crMode);

        this.recalcUnifiedChanges();
    }

    public get data(): SlideData<MotionSlideData> {
        return this._data;
    }

    public constructor(
        private sanitizer: DomSanitizer,
        private lineNumbering: LinenumberingService,
        private diff: DiffService
    ) {
        super();
    }

    /**
     * Returns all paragraphs that are affected by the given amendment as unified change objects.
     *
     * @param {MotionSlideDataAmendment} amendment
     * @returns {MotionSlideObjAmendmentParagraph[]}
     */
    public getAmendmentAmendedParagraphs(amendment: MotionSlideDataAmendment): MotionSlideObjAmendmentParagraph[] {
        let baseHtml = this.data.data.text;
        baseHtml = this.lineNumbering.insertLineNumbers(baseHtml, this.lineLength);
        const baseParagraphs = this.lineNumbering.splitToParagraphs(baseHtml);

        return amendment.amendment_paragraphs
            .map(
                (newText: string, paraNo: number): MotionSlideObjAmendmentParagraph => {
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
                        this.lineLength,
                        null,
                        null,
                        paragraphLines.from
                    );
                    newTextLines = this.diff.formatDiff(
                        this.diff.extractRangeByLineNumbers(newTextLines, affectedLines.from, affectedLines.to)
                    );

                    return new MotionSlideObjAmendmentParagraph(amendment, paraNo, newTextLines, affectedLines);
                }
            )
            .filter((para: MotionSlideObjAmendmentParagraph) => para !== null);
    }

    /**
     * Merges amendments and change recommendations and sorts them by the line numbers.
     * Called each time one of these arrays changes.
     */
    private recalcUnifiedChanges(): void {
        this.allChangingObjects = [];

        if (this.data.data.change_recommendations) {
            this.data.data.change_recommendations.forEach(change => {
                this.allChangingObjects.push(new MotionSlideObjChangeReco(change));
            });
        }
        if (this.data.data.amendments) {
            this.data.data.amendments.forEach(amendment => {
                const paras = this.getAmendmentAmendedParagraphs(amendment);
                paras.forEach(para => this.allChangingObjects.push(para));
            });
        }
        this.allChangingObjects.sort((a: ViewUnifiedChange, b: ViewUnifiedChange) => {
            if (a.getLineFrom() < b.getLineFrom()) {
                return -1;
            } else if (a.getLineFrom() > b.getLineFrom()) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    /**
     * Returns true, if this is a statute amendment
     *
     * @returns {boolean}
     */
    public isStatuteAmendment(): boolean {
        return !!this.data.data.base_statute;
    }

    /**
     * Returns true, if this is an paragraph-based amendment
     *
     * @returns {boolean}
     */
    public isParagraphBasedAmendment(): boolean {
        return (
            this.data.data.is_child &&
            this.data.data.amendment_paragraphs &&
            this.data.data.amendment_paragraphs.length > 0
        );
    }

    /**
     * Returns true if no line numbers are to be shown.
     *
     * @returns whether there are line numbers at all
     */
    public isLineNumberingNone(): boolean {
        return this.lnMode === LineNumberingMode.None;
    }

    /**
     * Returns true if the line numbers are to be shown within the text with no line breaks.
     *
     * @returns whether the line numberings are inside
     */
    public isLineNumberingInline(): boolean {
        return this.lnMode === LineNumberingMode.Inside;
    }

    /**
     * Returns true if the line numbers are to be shown to the left of the text.
     *
     * @returns whether the line numberings are outside
     */
    public isLineNumberingOutside(): boolean {
        return this.lnMode === LineNumberingMode.Outside;
    }

    /**
     * Called from the template to make a HTML string compatible with [innerHTML]
     * (otherwise line-number-data-attributes would be stripped out)
     *
     * @param {string} text
     * @returns {SafeHtml}
     */
    public sanitizedText(text: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(text);
    }

    /**
     * Extracts a renderable HTML string representing the given line number range of this motion
     *
     * @param {string} motionHtml
     * @param {LineRange} lineRange
     * @param {boolean} lineNumbers - weather to add line numbers to the returned HTML string
     * @param {number} lineLength
     */
    public extractMotionLineRange(
        motionHtml: string,
        lineRange: LineRange,
        lineNumbers: boolean,
        lineLength: number
    ): string {
        const origHtml = this.lineNumbering.insertLineNumbers(motionHtml, this.lineLength, this.highlightedLine);
        const extracted = this.diff.extractRangeByLineNumbers(origHtml, lineRange.from, lineRange.to);
        let html =
            extracted.outerContextStart +
            extracted.innerContextStart +
            extracted.html +
            extracted.innerContextEnd +
            extracted.outerContextEnd;
        if (lineNumbers) {
            html = this.lineNumbering.insertLineNumbers(html, lineLength, null, null, lineRange.from);
        }
        return html;
    }

    /**
     * get the formated motion text from the repository.
     *
     * @returns formated motion texts
     */
    public getFormattedText(): string {
        // Prevent this.allChangingObjects to be reordered from within formatMotion
        // const changes: ViewUnifiedChange[] = Object.assign([], this.allChangingObjects);
        const motion = this.data.data;

        switch (this.crMode) {
            case ChangeRecoMode.Original:
                return this.lineNumbering.insertLineNumbers(motion.text, this.lineLength, this.highlightedLine);
            case ChangeRecoMode.Changed:
                return this.diff.getTextWithChanges(
                    motion.text,
                    this.allChangingObjects,
                    this.lineLength,
                    this.highlightedLine
                );
            case ChangeRecoMode.Diff:
                let text = '';
                this.allChangingObjects.forEach((change: ViewUnifiedChange, idx: number) => {
                    if (idx === 0) {
                        const lineRange = { from: 1, to: change.getLineFrom() };
                        text += this.extractMotionLineRange(motion.text, lineRange, true, this.lineLength);
                    } else if (this.allChangingObjects[idx - 1].getLineTo() < change.getLineFrom()) {
                        const lineRange = {
                            from: this.allChangingObjects[idx - 1].getLineTo(),
                            to: change.getLineFrom()
                        };
                        text += this.extractMotionLineRange(motion.text, lineRange, true, this.lineLength);
                    }
                    text += this.diff.getChangeDiff(motion.text, change, this.lineLength, this.highlightedLine);
                });
                text += this.diff.getTextRemainderAfterLastChange(
                    motion.text,
                    this.allChangingObjects,
                    this.lineLength,
                    this.highlightedLine
                );
                return text;
            case ChangeRecoMode.Final:
                const appliedChanges: ViewUnifiedChange[] = this.allChangingObjects.filter(change =>
                    change.isAccepted()
                );
                return this.diff.getTextWithChanges(motion.text, appliedChanges, this.lineLength, this.highlightedLine);
            case ChangeRecoMode.ModifiedFinal:
                if (motion.modified_final_version) {
                    return this.lineNumbering.insertLineNumbers(
                        motion.modified_final_version,
                        this.lineLength,
                        this.highlightedLine,
                        null,
                        1
                    );
                } else {
                    // Use the final version as fallback, if the modified does not exist.
                    const appliedChangeObjects: ViewUnifiedChange[] = this.allChangingObjects.filter(change =>
                        change.isAccepted()
                    );
                    return this.diff.getTextWithChanges(
                        motion.text,
                        appliedChangeObjects,
                        this.lineLength,
                        this.highlightedLine
                    );
                }
            default:
                console.error('unrecognized ChangeRecoMode option (' + this.crMode + ')');
                return null;
        }
    }

    /**
     * If `this.data.data` is an amendment, this returns the list of all changed paragraphs.
     *
     * @returns {DiffLinesInParagraph[]}
     */
    public getAmendedParagraphs(): DiffLinesInParagraph[] {
        let baseHtml = this.data.data.base_motion.text;
        baseHtml = this.lineNumbering.insertLineNumbers(baseHtml, this.lineLength);
        const baseParagraphs = this.lineNumbering.splitToParagraphs(baseHtml);

        return this.data.data.amendment_paragraphs
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
                        this.lineLength
                    );
                }
            )
            .filter((para: DiffLinesInParagraph) => para !== null);
    }

    /**
     * get the diff html from the statute amendment, as SafeHTML for [innerHTML]
     *
     * @returns safe html strings
     */
    public getFormattedStatuteAmendment(): SafeHtml {
        let diffHtml = this.diff.diff(this.data.data.base_statute.text, this.data.data.text);
        diffHtml = this.lineNumbering.insertLineBreaksWithoutNumbers(diffHtml, this.lineLength, true);
        return this.sanitizer.bypassSecurityTrustHtml(diffHtml);
    }
}
