import { LineRange } from 'app/core/ui-services/diff.service';
import { ViewUnifiedChange, ViewUnifiedChangeType } from 'app/shared/models/motions/view-unified-change';
import { MotionSlideDataAmendment } from './motion-slide-data';

/**
 * This class adds methods to the MotionsMotionSlideDataChangeReco data object
 * necessary for use it as a UnifiedChange in the Diff-Functions
 */
export class MotionSlideObjAmendmentParagraph implements ViewUnifiedChange {
    public id: number;
    public type: number;
    public merge_amendment_into_final: number;
    public merge_amendment_into_diff: number;

    public constructor(
        data: MotionSlideDataAmendment,
        private paragraphNo: number,
        private newText: string,
        private lineRange: LineRange
    ) {
        this.id = data.id;
        this.merge_amendment_into_final = data.merge_amendment_into_final;
        this.merge_amendment_into_diff = data.merge_amendment_into_diff;
    }

    public getChangeId(): string {
        return 'amendment-' + this.id.toString(10) + '-' + this.paragraphNo.toString(10);
    }

    public getChangeType(): ViewUnifiedChangeType {
        return ViewUnifiedChangeType.TYPE_AMENDMENT;
    }

    public getChangeNewText(): string {
        return this.newText;
    }

    public getLineFrom(): number {
        return this.lineRange.from;
    }

    public getLineTo(): number {
        return this.lineRange.to;
    }

    public isAccepted(): boolean {
        return this.merge_amendment_into_final === 1;
    }

    public isRejected(): boolean {
        return this.merge_amendment_into_final === 0;
    }

    public showInDiffView(): boolean {
        return this.merge_amendment_into_diff === 1;
    }

    public showInFinalView(): boolean {
        return this.merge_amendment_into_final === 1;
    }

    public isTitleChange(): boolean {
        return false; // Not implemented for amendments
    }
}
