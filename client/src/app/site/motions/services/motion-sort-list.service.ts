import { Injectable } from '@angular/core';
import { SortListService, OsSortingDefinition } from '../../../core/services/sort-list.service';
import { ViewMotion } from '../models/view-motion';

@Injectable({
    providedIn: 'root'
})
export class MotionSortListService extends SortListService<ViewMotion> {
    public sortOptions: OsSortingDefinition<ViewMotion> = {
        sortProperty: 'callListWeight',
        sortAscending: true,
        options: [
            { property: 'callListWeight', label: 'Call List' },
            { property: 'supporters' },
            { property: 'identifier' },
            { property: 'title' },
            { property: 'submitters' },
            { property: 'category' },
            { property: 'motion_block_id', label: 'Motion block' },
            { property: 'state' },
            { property: 'creationDate', label: 'Creation date' },
            { property: 'lastChangeDate', label: 'Last modified' }
        ]
    };
    protected name = 'Motion';
}
