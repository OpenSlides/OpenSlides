import { Component, Input } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { SlideData } from 'app/core/core-services/projector-data.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { BaseMotionSlideComponentDirective } from '../base/base-motion-slide';
import { MotionBlockSlideData, MotionBlockSlideMotionRepresentation } from './motion-block-slide-data';

// Layout:
// 1) Long layout: Motion title is shown and the motions are
//    displayed in two lines: title and recommendation. This
//    mode is used until #motions<=SHORT_LAYOUT_THRESHOLD. There
//    are ROWS_PER_COLUMN_SHORT rows per column, is MAX_COLUMNS
//    is reached. If so, thhe rows per columns will be ignored.
// 2) Short Layout: Just motion identifier and the recommendation
//    in one line. This mode is used if #motions>SHORT_LAYOUT_THRESHOLD.
//    The same as in the log layout holds, just with ROWS_PER_COLUMN_SHORT.

const ROWS_PER_COLUMN_SHORT = 8;
const ROWS_PER_COLUMN_LONG = 16;
const SHORT_LAYOUT_THRESHOLD = 8;
const MAX_COLUMNS = 3;

@Component({
    selector: 'os-motion-block-slide',
    templateUrl: './motion-block-slide.component.html',
    styleUrls: ['./motion-block-slide.component.scss']
})
export class MotionBlockSlideComponent extends BaseMotionSlideComponentDirective<MotionBlockSlideData> {
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

            // Populate the motion with the recommendation_label
            data.data.motions.forEach(motion => {
                if (motion.recommendation) {
                    let recommendation = this.translate.instant(motion.recommendation.name);
                    if (motion.recommendation_extension) {
                        recommendation +=
                            ' ' +
                            this.replaceReferencedMotions(
                                motion.recommendation_extension,
                                data.data.referenced_motions
                            );
                    }
                    motion.recommendationLabel = recommendation;
                } else {
                    motion.recommendationLabel = null;
                }
            });

            // Check, if all motions have the same recommendation label
            if (data.data.motions.length > 0) {
                const recommendationLabel = data.data.motions[0].recommendationLabel;
                if (data.data.motions.every(motion => motion.recommendationLabel === recommendationLabel)) {
                    this.commonRecommendation = recommendationLabel;
                }
            } else {
                this.commonRecommendation = null;
            }
        } else {
            this.commonRecommendation = null;
        }
        this._data = data;
    }

    public get data(): SlideData<MotionBlockSlideData> {
        return this._data;
    }

    /**
     * If this is set, all motions have the same recommendation, saved in this variable.
     */
    public commonRecommendation: string | null = null;

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

    public get shortDisplayStyle(): boolean {
        return this.motionsAmount > SHORT_LAYOUT_THRESHOLD;
    }

    /**
     * @returns the amount of rows to display.
     */
    public get rows(): number {
        return Math.ceil(this.motionsAmount / this.columns);
    }

    /**
     * @returns an aray with [0, ..., this.rows-1]
     */
    public get rowsArray(): number[] {
        return this.makeIndicesArray(this.rows);
    }

    public get columns(): number {
        const rowsPerColumn = this.shortDisplayStyle ? ROWS_PER_COLUMN_SHORT : ROWS_PER_COLUMN_LONG;
        const columns = Math.ceil(this.motionsAmount / rowsPerColumn);
        if (columns > MAX_COLUMNS) {
            return MAX_COLUMNS;
        } else {
            return columns;
        }
    }

    /**
     * @returns an aray with [0, ..., this.columns-1]
     */
    public get columnsArray(): number[] {
        return this.makeIndicesArray(this.columns);
    }

    public constructor(translate: TranslateService, motionRepo: MotionRepositoryService) {
        super(translate, motionRepo);
        this.languageCollator = new Intl.Collator(this.translate.currentLang);
    }

    /**
     * @returns an array [0, ..., n-1]
     */
    public makeIndicesArray(n: number): number[] {
        const indices = [];
        for (let i = 0; i < n; i++) {
            indices.push(i);
        }
        return indices;
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
     * @returns the title of the given motion. If no title should be shown, just the
     * identifier is returned.
     */
    public getMotionTitle(i: number, j: number): string {
        if (this.shortDisplayStyle) {
            return this.motionRepo.getIdentifierOrTitle(this.getMotion(i, j));
        } else {
            return this.motionRepo.getTitle(this.getMotion(i, j));
        }
    }

    /**
     * @returns the identifier (of title if identifier not availabe) of the given motion.
     */
    public getMotionIdentifier(i: number, j: number): string {
        return this.motionRepo.getIdentifierOrTitle(this.getMotion(i, j));
    }

    /**
     * @returns the css color for the state of the motion in cell i and j
     */
    public getStateCssColor(i: number, j: number): string {
        return this.getMotion(i, j).recommendation.css_class || '';
    }
}
