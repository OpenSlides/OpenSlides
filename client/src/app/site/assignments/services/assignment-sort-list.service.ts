import { Injectable } from '@angular/core';
import { SortListService, OsSortingDefinition } from '../../../core/services/sort-list.service';
import { ViewAssignment } from '../models/view-assignment';

@Injectable({
    providedIn: 'root'
})
export class AssignmentSortListService extends SortListService<ViewAssignment> {

    public sortOptions: OsSortingDefinition<ViewAssignment> = {
        sortProperty: 'assignment',
        sortAscending: true,
        options: [
            { property: 'agendaItem', label: 'agenda Item' },
            { property: 'assignment' },
            { property: 'phase' },
            { property: 'candidateAmount', label: 'Number of candidates' }
        ]
    };
    protected name = 'Assignment';

}
