import { Component, Input } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { MotionBlockSlideData, MotionBlockSlideMotionRepresentation } from './motion-block-slide-data';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { StateCssClassMapping } from 'app/site/motions/models/view-workflow';
import { BaseMotionSlideComponent, MotionTitleInformation } from '../base/base-motion-slide';
import { SlideData } from 'app/core/core-services/projector-data.service';

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
                this.languageCollator.compare(this.getMotionIdentifier(a), this.getMotionIdentifier(b))
            );
        }
        this._data = data;
    }

    public get data(): SlideData<MotionBlockSlideData> {
        return this._data;
    }

    public constructor(translate: TranslateService, motionRepo: MotionRepositoryService) {
        super(translate, motionRepo);
        this.languageCollator = new Intl.Collator(this.translate.currentLang);
    }

    /**
     * @returns the title of the given motion.
     */
    public getMotionTitle(motion: MotionTitleInformation): string {
        return this.motionRepo.getTitle(motion);
    }

    /**
     * @returns the identifier (of title if identifier not availabe) of the given motion.
     */
    public getMotionIdentifier(motion: MotionTitleInformation): string {
        return this.motionRepo.getIdentifierOrTitle(motion);
    }

    public getStateCssColor(motion: MotionBlockSlideMotionRepresentation): string {
        return StateCssClassMapping[motion.recommendation.css_class] || '';
    }

    public getRecommendationLabel(motion: MotionBlockSlideMotionRepresentation): string {
        let recommendation = this.translate.instant(motion.recommendation.name);
        if (motion.recommendation_extension) {
            recommendation +=
                ' ' + this.replaceReferencedMotions(motion.recommendation_extension, this.data.data.referenced_motions);
        }
        return recommendation;
    }
}
