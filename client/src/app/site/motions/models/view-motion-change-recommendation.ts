import { ModificationType } from 'app/core/ui-services/diff.service';
import { MotionChangeRecommendation } from 'app/shared/models/motions/motion-change-reco';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewUnifiedChange, ViewUnifiedChangeType } from '../../../shared/models/motions/view-unified-change';
import { ViewMotion } from 'app/site/motions/models/view-motion';

export type MotionChangeRecommendationTitleInformation = object;

/**
 * Change recommendation class for the View
 *
 * Stores a motion including all (implicit) references
 * Provides "safe" access to variables and functions in {@link MotionChangeRecommendation}
 * @ignore
 */
export class ViewMotionChangeRecommendation
    extends BaseViewModel<MotionChangeRecommendation>
    implements MotionChangeRecommendationTitleInformation, ViewUnifiedChange
{
    public static COLLECTIONSTRING = MotionChangeRecommendation.COLLECTIONSTRING;
    protected _collectionString = MotionChangeRecommendation.COLLECTIONSTRING;

    private get firstLine(): number {
        if (this.motions?.length) {
            return this.motions[0].start_line_number;
        } else {
            return 1;
        }
    }

    public get changeRecommendation(): MotionChangeRecommendation {
        return this._model;
    }

    public updateChangeReco(type: number, text: string, internal: boolean): void {
        // @TODO HTML sanitazion
        this.changeRecommendation.type = type;
        this.changeRecommendation.text = text;
        this.changeRecommendation.internal = internal;
    }

    public get rejected(): boolean {
        return this.changeRecommendation.rejected;
    }

    public get internal(): boolean {
        return this.changeRecommendation.internal;
    }

    public get type(): number {
        return this.changeRecommendation.type || ModificationType.TYPE_REPLACEMENT;
    }

    public get other_description(): string {
        return this.changeRecommendation.other_description;
    }

    public get line_from(): number {
        return this.changeRecommendation.line_from + this.firstLine - 1;
    }

    public get line_to(): number {
        return this.changeRecommendation.line_to + this.firstLine - 1;
    }

    public get text(): string {
        return this.changeRecommendation.text;
    }

    public get motion_id(): number {
        return this.changeRecommendation.motion_id;
    }

    public getChangeId(): string {
        return 'recommendation-' + this.id.toString(10);
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

    public getChangeNewText(): string {
        return this.text;
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

interface MotionChangeRecommendationRelations {
    motions: ViewMotion[];
}

export interface ViewMotionChangeRecommendation extends MotionChangeRecommendationRelations {}
