import { Component } from '@angular/core';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { ItemListSlideData, SlideItem } from './item-list-slide-data';
import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { isBaseIsAgendaItemContentObjectRepository } from 'app/core/repositories/base-is-agenda-item-content-object-repository';

@Component({
    selector: 'os-item-list-slide',
    templateUrl: './item-list-slide.component.html',
    styleUrls: ['./item-list-slide.component.scss']
})
export class ItemListSlideComponent extends BaseSlideComponent<ItemListSlideData> {
    public constructor(private collectionStringMapperService: CollectionStringMapperService) {
        super();
    }

    public getTitle(item: SlideItem): string {
        const repo = this.collectionStringMapperService.getRepository(item.collection);
        if (isBaseIsAgendaItemContentObjectRepository(repo)) {
            return repo.getAgendaSlideTitle(item.title_information);
        } else {
            throw new Error('The content object has no agenda based repository!');
        }
    }

    public getItemStyle(item: SlideItem): object {
        return {
            'margin-left': 20 * item.depth + 'px'
        };
    }
}
