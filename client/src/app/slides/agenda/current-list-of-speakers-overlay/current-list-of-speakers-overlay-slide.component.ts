import { Component } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { CurrentListOfSpeakersSlideData } from '../base/current-list-of-speakers-slide-data';

@Component({
    selector: 'os-current-list-of-speakers-overlay-slide',
    templateUrl: './current-list-of-speakers-overlay-slide.component.html',
    styleUrls: ['./current-list-of-speakers-overlay-slide.component.scss']
})
export class CurrentListOfSpeakersOverlaySlideComponent extends BaseSlideComponent<CurrentListOfSpeakersSlideData> {
    public constructor() {
        super();
    }
}
