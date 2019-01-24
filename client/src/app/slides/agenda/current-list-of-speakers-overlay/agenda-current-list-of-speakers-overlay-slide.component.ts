import { Component, OnInit } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { HttpService } from 'app/core/services/http.service';
import { AgendaCurrentListOfSpeakersSlideData } from '../base/agenda-current-list-of-speakers-slide-data';

@Component({
    selector: 'os-agenda-current-list-of-speakers-overlay-slide',
    templateUrl: './agenda-current-list-of-speakers-overlay-slide.component.html',
    styleUrls: ['./agenda-current-list-of-speakers-overlay-slide.component.scss']
})
export class AgendaCurrentListOfSpeakersOverlaySlideComponent
    extends BaseSlideComponent<AgendaCurrentListOfSpeakersSlideData>
    implements OnInit {
    public constructor(private http: HttpService) {
        super();
        console.log(this.http);
    }

    public ngOnInit(): void {
        console.log('Hello from current list of speakers overlay');
    }
}
