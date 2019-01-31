import { Component } from '@angular/core';
import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { CoreCountdownSlideData } from './core-countdown-slide-data';

@Component({
    selector: 'os-core-countdown-slide',
    templateUrl: './core-countdown-slide.component.html',
    styleUrls: ['./core-countdown-slide.component.scss']
})
export class CoreCountdownSlideComponent extends BaseSlideComponent<CoreCountdownSlideData> {
    public constructor() {
        super();
    }
}
