import { LineRange } from 'app/core/ui-services/diff.service';
import { MergeAmendment } from 'app/shared/models/motions/state';
import { ViewMotion } from './view-motion';
import { ViewUnifiedChange, ViewUnifiedChangeType } from '../../../shared/models/motions/view-unified-change';

/**
 * This represents the Unified Diff part of an amendments.
 *
 * Hint: As we will probably support multiple affected paragraphs in one amendment in the future,
 * Amendments <-> ViewMotionAmendedParagraph is potentially a 1:n-relation
 */
export class ViewMotionAmendedParagraph implements ViewUnifiedChange {
    public get stateName(): string {
        return this.amendment.state.name;
    }

    public constructor(
        public amendment: ViewMotion,
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
     * HINT: This implementation should be consistent with get_amendment_merge_into_motion() in projector.py
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

    public showInDiffView(): boolean {
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

    public showInFinalView(): boolean {
        return this.amendment.state && this.amendment.state.merge_amendment_into_final === MergeAmendment.YES;
    }

    public isTitleChange(): boolean {
        return false; // Not implemented for amendments
    }
}
