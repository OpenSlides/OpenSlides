import { Component, Input } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { CommonListOfSpeakersSlideData } from '../common/common-list-of-speakers-slide-data';

/**
 * Interface, that describes how the speaker-objects look like.
 */
interface SpeakerObject {
    user: string;
    marked: boolean;
    end_time: number | null;
    weight: number | null;
}

@Component({
    selector: 'os-current-list-of-speakers-overlay-slide',
    templateUrl: './current-list-of-speakers-overlay-slide.component.html',
    styleUrls: ['./current-list-of-speakers-overlay-slide.component.scss']
})
export class CurrentListOfSpeakersOverlaySlideComponent extends BaseSlideComponent<CommonListOfSpeakersSlideData> {
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
    public currentSpeaker: SpeakerObject;

    /**
     * List with the next speakers for this list.
     */
    public nextSpeakers: SpeakerObject[] = [];

    public constructor() {
        super();
    }
}
