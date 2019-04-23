import { Component } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { CommonListOfSpeakersSlideData } from './common-list-of-speakers-slide-data';
import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { isBaseIsAgendaItemContentObjectRepository } from 'app/core/repositories/base-is-agenda-item-content-object-repository';

@Component({
    selector: 'os-common-list-of-speakers-slide',
    templateUrl: './common-list-of-speakers-slide.component.html',
    styleUrls: ['./common-list-of-speakers-slide.component.scss']
})
export class CommonListOfSpeakersSlideComponent extends BaseSlideComponent<CommonListOfSpeakersSlideData> {
    public constructor(private collectionStringMapperService: CollectionStringMapperService) {
        super();
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
