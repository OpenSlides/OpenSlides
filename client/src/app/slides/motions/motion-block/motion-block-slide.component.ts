import { Component } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import {
    MotionBlockSlideData,
    MotionBlockSlideMotionRepresentation,
    MotionTitleInformation
} from './motion-block-slide-data';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { StateCssClassMapping } from 'app/site/motions/models/view-workflow';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'os-motion-block-slide',
    templateUrl: './motion-block-slide.component.html',
    styleUrls: ['./motion-block-slide.component.scss']
})
export class MotionBlockSlideComponent extends BaseSlideComponent<MotionBlockSlideData> {
    public constructor(private motionRepo: MotionRepositoryService, private translate: TranslateService) {
        super();
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
            const extension = motion.recommendation_extension.replace(/\[motion:(\d+)\]/g, (match, id) => {
                const titleInformation = this.data.data.referenced_motions[id];
                if (titleInformation) {
                    return this.motionRepo.getIdentifierOrTitle(titleInformation);
                } else {
                    return this.translate.instant('<unknown motion>');
                }
            });

            recommendation += ' ' + extension;
        }
        return recommendation;
    }
}
