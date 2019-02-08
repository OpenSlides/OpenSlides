import { BaseViewModel } from '../../base/base-view-model';
import { ModificationType } from 'app/core/ui-services/diff.service';
import { MotionChangeRecommendation } from 'app/shared/models/motions/motion-change-reco';
import { ViewUnifiedChange, ViewUnifiedChangeType } from './view-unified-change';

/**
 * Change recommendation class for the View
 *
 * Stores a motion including all (implicit) references
 * Provides "safe" access to variables and functions in {@link MotionChangeReco}
 * @ignore
 */
export class ViewMotionChangeRecommendation extends BaseViewModel implements ViewUnifiedChange {
    private _changeRecommendation: MotionChangeRecommendation;

    public get id(): number {
        return this._changeRecommendation.id;
    }

    public get changeRecommendation(): MotionChangeRecommendation {
        return this._changeRecommendation;
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(changeReco: MotionChangeRecommendation) {
        super(MotionChangeRecommendation.COLLECTIONSTRING);
        this._changeRecommendation = changeReco;
    }

    public getTitle = () => {
        return 'Changerecommendation';
    };

    public updateDependencies(update: BaseViewModel): void {}

    public updateChangeReco(type: number, text: string, internal: boolean): void {
        // @TODO HTML sanitazion
        this._changeRecommendation.type = type;
        this._changeRecommendation.text = text;
        this._changeRecommendation.internal = internal;
    }

    public get rejected(): boolean {
        return this._changeRecommendation.rejected;
    }

    public get internal(): boolean {
        return this._changeRecommendation.internal;
    }

    public get type(): number {
        return this._changeRecommendation.type || ModificationType.TYPE_REPLACEMENT;
    }

    public get other_description(): string {
        return this._changeRecommendation.other_description;
    }

    public get line_from(): number {
        return this._changeRecommendation.line_from;
    }

    public get line_to(): number {
        return this._changeRecommendation.line_to;
    }

    public get text(): string {
        return this._changeRecommendation.text;
    }

    public get motion_id(): number {
        return this._changeRecommendation.motion_id;
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
}
