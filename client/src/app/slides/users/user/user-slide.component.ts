import { Component, Input } from '@angular/core';

import { SlideData } from 'app/core/core-services/projector-data.service';
import { BaseSlideComponentDirective } from 'app/slides/base-slide-component';
import { UserSlideData } from './user-slide-data';

@Component({
    selector: 'os-user-slide',
    templateUrl: './user-slide.component.html'
})
export class UserSlideComponent extends BaseSlideComponentDirective<UserSlideData> {
    @Input()
    public data: SlideData<UserSlideData>;

    public constructor() {
        super();
    }
}
