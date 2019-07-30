import { Component } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { UserSlideData } from './user-slide-data';

@Component({
    selector: 'os-user-slide',
    templateUrl: './user-slide.component.html'
})
export class UserSlideComponent extends BaseSlideComponent<UserSlideData> {
    public constructor() {
        super();
    }
}
