import { ViewUnifiedChange, ViewUnifiedChangeType } from './view-unified-change';
import { ViewMotion } from './view-motion';
import { LineRange } from 'app/core/ui-services/diff.service';
import { MergeAmendment } from 'app/shared/models/motions/workflow-state';

/**
 * This represents the Unified Diff part of an amendments.
 *
 * Hint: As we will probably support multiple affected paragraphs in one amendment in the future,
 * Amendments <-> ViewMotionAmendedParagraph is potentially a 1:n-relation
 */
export class ViewMotionAmendedParagraph implements ViewUnifiedChange {
    public constructor(
        private amendment: ViewMotion,
        private paragraphNo: number,
        private newText: string,
        private lineRange: LineRange
    ) {}

    public getChangeId(): string {
        return 'amendment-' + this.amendment.id.toString(10) + '-' + this.paragraphNo.toString(10);
    }

    public getChangeType(): ViewUnifiedChangeType {
        return ViewUnifiedChangeType.TYPE_AMENDMENT;
    }

    public getLineFrom(): number {
        return this.lineRange.from;
    }

    public getLineTo(): number {
        return this.lineRange.to;
    }

    public getChangeNewText(): string {
        return this.newText;
    }

    /**
     * The state and recommendation of this amendment is considered.
     * The state takes precedence.
     *
     * @returns {boolean}
     */
    public isAccepted(): boolean {
        const mergeState = this.amendment.state
            ? this.amendment.state.merge_amendment_into_final
            : MergeAmendment.UNDEFINED;
        switch (mergeState) {
            case MergeAmendment.YES:
                return true;
            case MergeAmendment.NO:
                return false;
            default:
                const mergeRecommendation = this.amendment.recommendation
                    ? this.amendment.recommendation.merge_amendment_into_final
                    : MergeAmendment.UNDEFINED;
                switch (mergeRecommendation) {
                    case MergeAmendment.YES:
                        return true;
                    case MergeAmendment.NO:
                        return false;
                    default:
                        return false;
                }
        }
    }

    /**
     * @returns {boolean}
     */
    public isRejected(): boolean {
        return !this.isAccepted();
    }

    public getIdentifier(): string {
        return this.amendment.identifier;
    }
}
