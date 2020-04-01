import { Component } from '@angular/core';

import { BaseSlideComponentDirective } from 'app/slides/base-slide-component';
import { CurrentSpeakerChyronSlideData } from './current-speaker-chyron-slide-data';

@Component({
    selector: 'os-current-speaker-chyron-speakers-slide',
    templateUrl: './current-speaker-chyron-slide.component.html',
    styleUrls: ['./current-speaker-chyron-slide.component.scss']
})
export class CurrentSpeakerChyronSlideComponent extends BaseSlideComponentDirective<CurrentSpeakerChyronSlideData> {
    public constructor() {
        super();
    }
}
