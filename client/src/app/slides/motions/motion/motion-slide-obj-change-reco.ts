import { ViewUnifiedChange, ViewUnifiedChangeType } from 'app/shared/models/motions/view-unified-change';
import { MotionSlideDataChangeReco } from './motion-slide-data';

/**
 * This class adds methods to the MotionsMotionSlideDataChangeReco data object
 * necessary for use it as a UnifiedChange in the Diff-Functions
 */
export class MotionSlideObjChangeReco implements MotionSlideDataChangeReco, ViewUnifiedChange {
    public creation_time: string;
    public id: number;
    public internal: boolean;
    public line_from: number;
    public line_to: number;
    public motion_id: number;
    public other_description: string;
    public rejected: false;
    public text: string;
    public type: number;

    public constructor(data: MotionSlideDataChangeReco) {
        Object.assign(this, data);
    }

    public getChangeId(): string {
        return 'recommendation-' + this.id.toString(10);
    }

    public getChangeNewText(): string {
        return this.text;
    }

    public getChangeType(): ViewUnifiedChangeType {
        return ViewUnifiedChangeType.TYPE_CHANGE_RECOMMENDATION;
    }

    public getLineFrom(): number {
        return this.line_from;
    }

    public getLineTo(): number {
        return this.line_to;
    }

    public isAccepted(): boolean {
        return !this.rejected;
    }

    public isRejected(): boolean {
        return this.rejected;
    }

    public showInDiffView(): boolean {
        return true;
    }

    public showInFinalView(): boolean {
        return !this.rejected;
    }

    public isTitleChange(): boolean {
        return this.line_from === 0 && this.line_to === 0;
    }
}
