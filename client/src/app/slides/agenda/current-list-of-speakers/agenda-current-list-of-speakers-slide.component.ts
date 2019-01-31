import { Component, OnInit } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { AgendaCurrentListOfSpeakersSlideData } from '../base/agenda-current-list-of-speakers-slide-data';

@Component({
    selector: 'os-agenda-current-list-of-speakers-slide',
    templateUrl: './agenda-current-list-of-speakers-slide.component.html',
    styleUrls: ['./agenda-current-list-of-speakers-slide.component.scss']
})
export class AgendaCurrentListOfSpeakersSlideComponent extends BaseSlideComponent<AgendaCurrentListOfSpeakersSlideData>
    implements OnInit {
    public constructor() {
        super();
    }

    public ngOnInit(): void {
        console.log('Hello from current list of speakers slide');
    }
}
