import { Component, Input } from '@angular/core';

import { ListOfSpeakersRepositoryService } from 'app/core/repositories/agenda/list-of-speakers-repository.service';
import { ContentObject, isContentObject } from 'app/shared/models/base/content-object';
import { ViewListOfSpeakers } from 'app/site/agenda/models/view-list-of-speakers';
import {
    BaseViewModelWithListOfSpeakers,
    isBaseViewModelWithListOfSpeakers
} from 'app/site/base/base-view-model-with-list-of-speakers';

/**
 * A generic button to go to the list of speakers. Give the content object with
 * [object]=object, which can be a ContentObject or a ViewModelWithListOfSpeakers.
 * - Usage as a mini-fab (like in the agenda) with [menuItem]=false (default)
 * - Usage in a dropdown (=list) with [menuItem]=true
 */
@Component({
    selector: 'os-speaker-button',
    templateUrl: './speaker-button.component.html'
})
export class SpeakerButtonComponent {
    @Input()
    public set object(obj: BaseViewModelWithListOfSpeakers | ContentObject | null) {
        if (isBaseViewModelWithListOfSpeakers(obj)) {
            this.listOfSpeakers = obj.listOfSpeakers;
        } else if (isContentObject(obj)) {
            this.listOfSpeakers = this.listOfSpeakersRepo.findByContentObject(obj);
        } else {
            this.listOfSpeakers = null;
        }
    }

    public listOfSpeakers: ViewListOfSpeakers | null;

    @Input()
    public disabled: boolean;

    @Input()
    public menuItem = false;

    public get listOfSpeakersUrl(): string {
        if (!this.disabled) {
            return this.listOfSpeakers.listOfSpeakersUrl;
        }
    }

    /**
     * The constructor
     */
    public constructor(private listOfSpeakersRepo: ListOfSpeakersRepositoryService) {}
}
