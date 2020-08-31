import { ModificationType } from 'app/core/ui-services/diff.service';
import { MotionChangeRecommendation } from 'app/shared/models/motions/motion-change-reco';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewUnifiedChange, ViewUnifiedChangeType } from '../../../shared/models/motions/view-unified-change';

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
    implements MotionChangeRecommendationTitleInformation, ViewUnifiedChange {
    public static COLLECTIONSTRING = MotionChangeRecommendation.COLLECTIONSTRING;
    protected _collectionString = MotionChangeRecommendation.COLLECTIONSTRING;

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
        return this.changeRecommendation.line_from;
    }

    public get line_to(): number {
        return this.changeRecommendation.line_to;
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
