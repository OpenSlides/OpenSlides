import { Component, Input } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { PollSlideData } from './poll-slide-data';
import { SlideData } from 'app/core/core-services/projector-data.service';

@Component({
    selector: 'os-poll-slide',
    templateUrl: './poll-slide.component.html',
    styleUrls: ['./poll-slide.component.scss']
})
export class PollSlideComponent extends BaseSlideComponent<PollSlideData> {
    // TODO: Remove the following block, if not needed.
    // This is just for debugging to get a console statement with all recieved
    // data from the server
    private _data: SlideData<PollSlideData>;
    @Input()
    public set data(data: SlideData<PollSlideData>) {
        this._data = data;
        console.log('Data: ', data);
    }
    public get data(): SlideData<PollSlideData> {
        return this._data;
    }
    // UNTIL HERE

    public constructor() {
        super();
    }
}
