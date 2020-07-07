import { Component, Input } from '@angular/core';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { SlideData } from 'app/core/core-services/projector-data.service';
import { isBaseIsAgendaItemContentObjectRepository } from 'app/core/repositories/base-is-agenda-item-content-object-repository';
import { ProjectorElement } from 'app/shared/models/core/projector';
import { BaseSlideComponentDirective } from 'app/slides/base-slide-component';
import { ItemListSlideData, SlideItem } from './item-list-slide-data';

@Component({
    selector: 'os-item-list-slide',
    templateUrl: './item-list-slide.component.html',
    styleUrls: ['./item-list-slide.component.scss']
})
export class ItemListSlideComponent extends BaseSlideComponentDirective<ItemListSlideData> {
    @Input()
    public set data(value: SlideData<ItemListSlideData, ProjectorElement>) {
        value.data.items.forEach(
            item => (item.title_information.agenda_item_number = () => item.title_information._agenda_item_number)
        );
        this._data = value;
    }

    public get data(): SlideData<ItemListSlideData, ProjectorElement> {
        return this._data;
    }

    private _data: SlideData<ItemListSlideData, ProjectorElement>;

    public constructor(private collectionStringMapperService: CollectionStringMapperService) {
        super();
    }

    public getTitle(item: SlideItem): string {
        const repo = this.collectionStringMapperService.getRepository(item.collection);
        if (isBaseIsAgendaItemContentObjectRepository(repo)) {
            return repo.getListTitle(item.title_information);
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
