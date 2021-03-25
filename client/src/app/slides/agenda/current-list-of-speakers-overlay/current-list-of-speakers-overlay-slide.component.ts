import { Component, Input } from '@angular/core';

import { BaseSlideComponentDirective } from 'app/slides/base-slide-component';
import { CommonListOfSpeakersSlideData, SlideSpeaker } from '../common/common-list-of-speakers-slide-data';

// prettier-ignore
@Component({
    selector: 'os-current-list-of-speakers-overlay-slide',
    templateUrl: './current-list-of-speakers-overlay-slide.component.html',
    styleUrls: ['./current-list-of-speakers-overlay-slide.component.scss']
})
export class CurrentListOfSpeakersOverlaySlideComponent extends BaseSlideComponentDirective<
    CommonListOfSpeakersSlideData
> {
    /**
     * Gets the data. Sets necessary information for the list of speakers in the overlay.
     *
     * @param data The passed data to this overlay.
     */
    @Input()
    public set data(data: any) {
        if (data.data.current) {
            this.currentSpeaker = data.data.current;
        }
        if (data.data.waiting) {
            this.nextSpeakers = data.data.waiting;
        }
    }

    /**
     * The current speaker.
     */
    public currentSpeaker: SlideSpeaker;

    /**
     * List with the next speakers for this list.
     */
    public nextSpeakers: SlideSpeaker[] = [];

    public constructor() {
        super();
    }
}
