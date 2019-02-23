import {Component} from '@angular/core';
import {computed} from 'mobx-angular';


import {BaseSlideComponent} from 'app/slides/base-slide-component';
import {MediafileSlideData} from './mediafile-slide-data';

@Component({
    selector: 'os-mediafile-slide',
    templateUrl: './mediafile-slide.component.html',
    styleUrls: ['./mediafile-slide.component.scss']
})
export class MediafileSlideComponent extends BaseSlideComponent<MediafileSlideData> {
    public constructor() {
        super();
    }

    @computed get url() {
        return `${this.data.data.media_url_prefix}/${this.data.data.path}`;
    }
}
