import { Component, OnInit } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { CurrentListOfSpeakersSlideData } from '../base/current-list-of-speakers-slide-data';

@Component({
    selector: 'os-current-list-of-speakers-slide',
    templateUrl: './current-list-of-speakers-slide.component.html',
    styleUrls: ['./current-list-of-speakers-slide.component.scss']
})
export class CurrentListOfSpeakersSlideComponent extends BaseSlideComponent<CurrentListOfSpeakersSlideData>
    implements OnInit {
    public constructor() {
        super();
    }

    public ngOnInit(): void {}
}
