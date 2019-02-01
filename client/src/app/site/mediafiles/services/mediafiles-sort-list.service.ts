import { Injectable } from '@angular/core';
import { BaseSortListService, OsSortingDefinition } from '../../../core/ui-services/base-sort-list.service';
import { ViewMediafile } from '../models/view-mediafile';

@Injectable({
    providedIn: 'root'
})
export class MediafilesSortListService extends BaseSortListService<ViewMediafile> {
    public sortOptions: OsSortingDefinition<ViewMediafile> = {
        sortProperty: 'title',
        sortAscending: true,
        options: [{ property: 'title' }, { property: 'type' }, { property: 'size' }]
    };
    protected name = 'Mediafile';
}
