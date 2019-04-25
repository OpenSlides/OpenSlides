import { Component, Input } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { AssignmentSlideData } from './assignment-slide-data';
import { SlideData } from 'app/core/core-services/projector-data.service';

@Component({
    selector: 'os-assignment-slide',
    templateUrl: './assignment-slide.component.html',
    styleUrls: ['./assignment-slide.component.scss']
})
export class AssignmentSlideComponent extends BaseSlideComponent<AssignmentSlideData> {
    // TODO: Remove the following block, if not needed.
    // This is just for debugging to get a console statement with all recieved
    // data from the server
    private _data: SlideData<AssignmentSlideData>;
    @Input()
    public set data(data: SlideData<AssignmentSlideData>) {
        this._data = data;
    }

    public get data(): SlideData<AssignmentSlideData> {
        return this._data;
    }

    public constructor() {
        super();
    }
}
