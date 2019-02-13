import { Component } from '@angular/core';
import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { TopicsTopicSlideData } from './topics-topic-slide-data';

@Component({
    selector: 'os-topic-slide',
    templateUrl: './topics-topic-slide.component.html',
    styleUrls: ['./topics-topic-slide.component.scss']
})
export class TopicsTopicSlideComponent extends BaseSlideComponent<TopicsTopicSlideData> {
    public constructor() {
        super();
    }
}
