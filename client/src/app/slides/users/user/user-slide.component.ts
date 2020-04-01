import { Component } from '@angular/core';

import { BaseSlideComponentDirective } from 'app/slides/base-slide-component';
import { UserSlideData } from './user-slide-data';

@Component({
    selector: 'os-user-slide',
    templateUrl: './user-slide.component.html'
})
export class UserSlideComponent extends BaseSlideComponentDirective<UserSlideData> {
    public constructor() {
        super();
    }
}
