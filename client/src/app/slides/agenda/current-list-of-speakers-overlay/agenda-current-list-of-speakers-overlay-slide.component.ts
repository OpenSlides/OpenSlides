import { Component } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { AgendaCurrentListOfSpeakersSlideData } from '../base/agenda-current-list-of-speakers-slide-data';

@Component({
    selector: 'os-agenda-current-list-of-speakers-overlay-slide',
    templateUrl: './agenda-current-list-of-speakers-overlay-slide.component.html',
    styleUrls: ['./agenda-current-list-of-speakers-overlay-slide.component.scss']
})
export class AgendaCurrentListOfSpeakersOverlaySlideComponent extends BaseSlideComponent<
    AgendaCurrentListOfSpeakersSlideData
> {
    public constructor() {
        super();
    }
}
