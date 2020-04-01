import { Component, Input, OnInit } from '@angular/core';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { SlideData } from 'app/core/core-services/projector-data.service';
import { isBaseIsAgendaItemContentObjectRepository } from 'app/core/repositories/base-is-agenda-item-content-object-repository';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ProjectorElement } from 'app/shared/models/core/projector';
import { BaseSlideComponentDirective } from 'app/slides/base-slide-component';
import { CommonListOfSpeakersSlideData } from './common-list-of-speakers-slide-data';

@Component({
    selector: 'os-common-list-of-speakers-slide',
    templateUrl: './common-list-of-speakers-slide.component.html',
    styleUrls: ['./common-list-of-speakers-slide.component.scss']
})
export class CommonListOfSpeakersSlideComponent extends BaseSlideComponentDirective<CommonListOfSpeakersSlideData>
    implements OnInit {
    @Input()
    public set data(value: SlideData<CommonListOfSpeakersSlideData, ProjectorElement>) {
        // In the case of projected references without ListOfSpeakers Slide
        if (Object.entries(value.data).length) {
            value.data.title_information.agenda_item_number = () => value.data.title_information._agenda_item_number;
            this._data = value;
        }
    }

    public get data(): SlideData<CommonListOfSpeakersSlideData, ProjectorElement> {
        return this._data;
    }

    private _data: SlideData<CommonListOfSpeakersSlideData, ProjectorElement>;

    /**
     * Boolean, whether the amount of speakers should be shown.
     */
    public hideAmountOfSpeakers: boolean;

    public constructor(
        private collectionStringMapperService: CollectionStringMapperService,
        private configService: ConfigService
    ) {
        super();
    }

    /**
     * OnInit-function.
     * Load the config for `agenda_hide_amount_of_speakers`.
     */
    public ngOnInit(): void {
        this.configService
            .get<boolean>('agenda_hide_amount_of_speakers')
            .subscribe(enabled => (this.hideAmountOfSpeakers = enabled));
    }

    public getTitle(): string {
        if (!this.data.data.content_object_collection || !this.data.data.title_information) {
            return '';
        }

        const repo = this.collectionStringMapperService.getRepository(this.data.data.content_object_collection);

        if (isBaseIsAgendaItemContentObjectRepository(repo)) {
            return repo.getAgendaSlideTitle(this.data.data.title_information);
        } else {
            throw new Error('The content object has no agenda base repository!');
        }
    }

    /**
     * @retuns the amount of waiting speakers
     */
    public getSpeakersCount(): number {
        if (this.data && this.data.data.waiting) {
            return this.data.data.waiting.length;
        }
        return 0;
    }
}
