import { ViewUnifiedChange, ViewUnifiedChangeType } from '../../../shared/models/motions/view-unified-change';
import { MotionSlideDataAmendment } from './motion-slide-data';
import { MergeAmendment } from '../../../shared/models/motions/workflow-state';
import { LineRange } from '../../../core/ui-services/diff.service';

/**
 * This class adds methods to the MotionsMotionSlideDataChangeReco data object
 * necessary for use it as a UnifiedChange in the Diff-Functions
 */
export class MotionSlideObjAmendmentParagraph implements ViewUnifiedChange {
    public id: number;
    public type: number;
    public merge_amendment_into_final: MergeAmendment;

    public constructor(
        data: MotionSlideDataAmendment,
        private paragraphNo: number,
        private newText: string,
        private lineRange: LineRange
    ) {
        this.id = data.id;
        this.merge_amendment_into_final = data.merge_amendment_into_final;
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
        return this.merge_amendment_into_final === MergeAmendment.YES;
    }

    public isRejected(): boolean {
        return this.merge_amendment_into_final === MergeAmendment.NO;
    }
}
