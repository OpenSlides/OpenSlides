import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { BaseSortListService, OsSortingDefinition, OsSortingOption } from 'app/core/ui-services/base-sort-list.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { ViewAssignment } from '../models/view-assignment';

/**
 * Sorting service for the assignment list
 */
@Injectable({
    providedIn: 'root'
})
export class AssignmentSortListService extends BaseSortListService<ViewAssignment> {
    /**
     * Define the sort options
     */
    public sortOptions: OsSortingOption<ViewAssignment>[] = [
        { property: 'assignment', label: 'Name' },
        { property: 'phase', label: 'Phase' },
        { property: 'candidateAmount', label: 'Number of candidates' }
    ];

    /**
     * Constructor.
     *
     * @param translate required by parent
     * @param storage required by parent
     */
    public constructor(translate: TranslateService, storage: StorageService) {
        super('Assignment', translate, storage);
    }

    /**
     * Required by parent
     *
     * @returns the default sorting strategy
     */
    public async getDefaultDefinition(): Promise<OsSortingDefinition<ViewAssignment>> {
        return {
            sortProperty: 'assignment',
            sortAscending: true
        };
    }
}
