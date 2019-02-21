import { Component } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { MotionBlockSlideData, MotionBlockSlideMotionRepresentation } from './motion-block-slide-data';
import { Motion } from 'app/shared/models/motions/motion';
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

    public getMotionTitle(motion: Partial<Motion>): string {
        return this.motionRepo.getAgendaTitle(motion);
    }

    public getStateCssColor(motion: MotionBlockSlideMotionRepresentation): string {
        return StateCssClassMapping[motion.recommendation.css_class] || '';
    }

    public getStateLabel(motion: MotionBlockSlideMotionRepresentation): string {
        let recommendation = this.translate.instant(motion.recommendation.name);
        if (motion.recommendation_extension) {
            recommendation += ' ' + motion.recommendation_extension;
        }
        return recommendation;
    }
}
