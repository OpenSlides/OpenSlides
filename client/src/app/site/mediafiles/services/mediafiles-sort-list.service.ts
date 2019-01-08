import { Injectable } from '@angular/core';
import { SortListService, OsSortingDefinition } from '../../../core/services/sort-list.service';
import { ViewMediafile } from '../models/view-mediafile';


@Injectable({
    providedIn: 'root'
})
export class MediafilesSortListService extends SortListService<ViewMediafile> {

    public sortOptions: OsSortingDefinition<ViewMediafile> = {
        sortProperty: 'title',
        sortAscending: true,
        options: [
            { property: 'title' },
            { property: 'type' },
            { property: 'size' },
            // { property: 'upload_date' }
            { property: 'uploader' }
        ]
    };
    protected name = 'Mediafile';
}
