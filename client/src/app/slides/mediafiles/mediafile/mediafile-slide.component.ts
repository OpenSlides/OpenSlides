import { Component } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { MediafileSlideData } from './mediafile-slide-data';

@Component({
    selector: 'os-mediafile-slide',
    templateUrl: './mediafile-slide.component.html',
    styleUrls: ['./mediafile-slide.component.scss']
})
export class MediafileSlideComponent extends BaseSlideComponent<MediafileSlideData> {
    public constructor() {
        super();
    }
}
