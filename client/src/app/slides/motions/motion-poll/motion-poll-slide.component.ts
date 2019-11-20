import { Component } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { MotionPollSlideData } from './motion-poll-slide-data';

@Component({
    selector: 'os-motion-poll-slide',
    templateUrl: './motion-poll-slide.component.html',
    styleUrls: ['./motion-poll-slide.component.scss']
})
export class MotionPollSlideComponent extends BaseSlideComponent<MotionPollSlideData> {
    public get verboseData(): string {
        return JSON.stringify(this.data, null, 2);
    }
}
