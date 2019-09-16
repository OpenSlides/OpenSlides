import { Component } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { TopicSlideData } from './topic-slide-data';

@Component({
    selector: 'os-topic-slide',
    templateUrl: './topic-slide.component.html',
    styleUrls: ['./topic-slide.component.scss']
})
export class TopicSlideComponent extends BaseSlideComponent<TopicSlideData> {
    public constructor() {
        super();
    }
}
