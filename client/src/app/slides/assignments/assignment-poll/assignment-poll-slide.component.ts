import { Component } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { AssignmentPollSlideData } from './assignment-poll-slide-data';

@Component({
    selector: 'os-assignment-poll-slide',
    templateUrl: './assignment-poll-slide.component.html',
    styleUrls: ['./assignment-poll-slide.component.scss']
})
export class AssignmentPollSlideComponent extends BaseSlideComponent<AssignmentPollSlideData> {
    public get verboseData(): string {
        return JSON.stringify(this.data, null, 2);
    }
}
