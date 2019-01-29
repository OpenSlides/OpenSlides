import { Component, OnInit, Input } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { HttpService } from 'app/core/services/http.service';
import { AgendaCurrentListOfSpeakersSlideData } from '../base/agenda-current-list-of-speakers-slide-data';
import { SlideData } from 'app/site/projector/services/projector-data.service';

@Component({
    selector: 'os-agenda-current-list-of-speakers-slide',
    templateUrl: './agenda-current-list-of-speakers-slide.component.html',
    styleUrls: ['./agenda-current-list-of-speakers-slide.component.scss']
})
export class AgendaCurrentListOfSpeakersSlideComponent extends BaseSlideComponent<AgendaCurrentListOfSpeakersSlideData>
    implements OnInit {
    private _data: SlideData<AgendaCurrentListOfSpeakersSlideData>;

    public isOverlay: boolean;

    public get data(): SlideData<AgendaCurrentListOfSpeakersSlideData> {
        return this._data;
    }

    @Input()
    public set data(value: SlideData<AgendaCurrentListOfSpeakersSlideData>) {
        this.isOverlay = !value || value.element.stable;
        this._data = value;
    }

    public constructor(private http: HttpService) {
        super();
        console.log(this.http);
    }

    public ngOnInit(): void {
        console.log('Hello from current list of speakers slide');
    }
}
