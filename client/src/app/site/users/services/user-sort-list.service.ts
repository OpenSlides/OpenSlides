import { Injectable } from '@angular/core';
import { BaseSortListService, OsSortingDefinition } from '../../../core/ui-services/base-sort-list.service';
import { ViewUser } from '../models/view-user';

@Injectable({
    providedIn: 'root'
})
export class UserSortListService extends BaseSortListService<ViewUser> {
    public sortOptions: OsSortingDefinition<ViewUser> = {
        sortProperty: 'first_name',
        sortAscending: true,
        options: [
            { property: 'first_name', label: 'Given name' },
            { property: 'last_name', label: 'Surname' },
            { property: 'is_present', label: 'Presence' },
            { property: 'is_active', label: 'Is active' },
            { property: 'is_committee', label: 'Is Committee' },
            { property: 'participant_number', label: 'Number' },
            { property: 'structure_level', label: 'Structure level' },
            { property: 'comment' }
            // TODO email send?
        ]
    };
    protected name = 'User';
}
