import { Component, Input } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { MotionBlockSlideData, MotionBlockSlideMotionRepresentation } from './motion-block-slide-data';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { StateCssClassMapping } from 'app/site/motions/models/view-workflow';
import { BaseMotionSlideComponent } from '../base/base-motion-slide';
import { SlideData } from 'app/core/core-services/projector-data.service';

/**
 * The row threshold to switch from one to a two column layout
 */
const TWO_COLUMNS_THRESHOLD = 8;

@Component({
    selector: 'os-motion-block-slide',
    templateUrl: './motion-block-slide.component.html',
    styleUrls: ['./motion-block-slide.component.scss']
})
export class MotionBlockSlideComponent extends BaseMotionSlideComponent<MotionBlockSlideData> {
    /**
     * For sorting motion blocks by their displayed title
     */
    private languageCollator: Intl.Collator;

    private _data: SlideData<MotionBlockSlideData>;

    /**
     * Sort the motions given.
     */
    @Input()
    public set data(data: SlideData<MotionBlockSlideData>) {
        if (data && data.data.motions) {
            data.data.motions = data.data.motions.sort((a, b) =>
                this.languageCollator.compare(
                    this.motionRepo.getIdentifierOrTitle(a),
                    this.motionRepo.getIdentifierOrTitle(b)
                )
            );
        }
        this._data = data;
    }

    public get data(): SlideData<MotionBlockSlideData> {
        return this._data;
    }

    /**
     * @returns the amount of motions in this block
     */
    public get motionsAmount(): number {
        if (this.data && this.data.data.motions) {
            return this.data.data.motions.length;
        } else {
            return 0;
        }
    }

    /**
     * @returns the amount of rows to display.
     */
    public get rows(): number {
        let rows = this.motionsAmount;
        if (this.motionsAmount > TWO_COLUMNS_THRESHOLD) {
            rows = Math.ceil(rows / 2);
        }
        return rows;
    }

    /**
     * @returns an aray with [1, ..., this.rows]
     */
    public get rowsArray(): number[] {
        const indices = [];
        const rows = this.rows;
        for (let i = 0; i < rows; i++) {
            indices.push(i);
        }
        return indices;
    }

    /**
     * @returns [0] or [0, 1] if one or two columns are used
     */
    public get columnsArray(): number[] {
        if (this.motionsAmount > TWO_COLUMNS_THRESHOLD) {
            return [0, 1];
        } else {
            return [0];
        }
    }

    public constructor(translate: TranslateService, motionRepo: MotionRepositoryService) {
        super(translate, motionRepo);
        this.languageCollator = new Intl.Collator(this.translate.currentLang);
    }

    /**
     * Get the motion for the cell given by i and j
     *
     * @param i the row
     * @param j the column
     */
    private getMotion(i: number, j: number): MotionBlockSlideMotionRepresentation {
        const index = i + this.rows * j;
        return this.data.data.motions[index];
    }

    /**
     * @returns the title of the given motion.
     */
    public getMotionTitle(i: number, j: number): string {
        return this.motionRepo.getTitle(this.getMotion(i, j));
    }

    /**
     * @returns the identifier (of title if identifier not availabe) of the given motion.
     */
    public getMotionIdentifier(i: number, j: number): string {
        return this.motionRepo.getIdentifierOrTitle(this.getMotion(i, j));
    }

    /**
     * @returns true if the motion in cell i and j has a recommendation
     */
    public hasRecommendation(i: number, j: number): boolean {
        return !!this.getMotion(i, j).recommendation;
    }

    /**
     * @returns the css color for the state of the motion in cell i and j
     */
    public getStateCssColor(i: number, j: number): string {
        return StateCssClassMapping[this.getMotion(i, j).recommendation.css_class] || '';
    }

    /**
     * @returns the recommendation label for motion in cell i and j
     */
    public getRecommendationLabel(i: number, j: number): string {
        const motion = this.getMotion(i, j);
        let recommendation = this.translate.instant(motion.recommendation.name);
        if (motion.recommendation_extension) {
            recommendation +=
                ' ' + this.replaceReferencedMotions(motion.recommendation_extension, this.data.data.referenced_motions);
        }
        return recommendation;
    }
}
