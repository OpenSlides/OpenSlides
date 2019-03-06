import { Component } from '@angular/core';

import {
    MotionBlockSlideData,
    MotionBlockSlideMotionRepresentation,
    MotionTitleInformation
} from './motion-block-slide-data';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { StateCssClassMapping } from 'app/site/motions/models/view-workflow';
import { TranslateService } from '@ngx-translate/core';
import { BaseMotionSlideComponent } from '../base/base-motion-slide';

@Component({
    selector: 'os-motion-block-slide',
    templateUrl: './motion-block-slide.component.html',
    styleUrls: ['./motion-block-slide.component.scss']
})
export class MotionBlockSlideComponent extends BaseMotionSlideComponent<MotionBlockSlideData> {
    public constructor(translate: TranslateService, motionRepo: MotionRepositoryService) {
        super(translate, motionRepo);
    }

    public getMotionTitle(motion: MotionTitleInformation): string {
        return this.motionRepo.getTitle(motion);
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
