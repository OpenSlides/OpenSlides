import { Component, Input } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { CommonListOfSpeakersSlideData } from '../common/common-list-of-speakers-slide-data';

@Component({
    selector: 'os-current-list-of-speakers-overlay-slide',
    templateUrl: './current-list-of-speakers-overlay-slide.component.html',
    styleUrls: ['./current-list-of-speakers-overlay-slide.component.scss']
})
export class CurrentListOfSpeakersOverlaySlideComponent extends BaseSlideComponent<CommonListOfSpeakersSlideData> {
    // TODO: remove to access data in the template
    @Input()
    public set data(value: any) {
        console.log(value.data);
    }

    public constructor() {
        super();
    }
}
