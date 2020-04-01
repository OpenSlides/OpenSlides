import { Component } from '@angular/core';

import { BaseSlideComponentDirective } from 'app/slides/base-slide-component';
import { CountdownSlideData } from './countdown-slide-data';

@Component({
    selector: 'os-countdown-slide',
    templateUrl: './countdown-slide.component.html',
    styleUrls: ['./countdown-slide.component.scss']
})
export class CountdownSlideComponent extends BaseSlideComponentDirective<CountdownSlideData> {
    public constructor() {
        super();
    }
}
