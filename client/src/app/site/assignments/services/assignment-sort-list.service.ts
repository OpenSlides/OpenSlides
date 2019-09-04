import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { OpenSlidesStatusService } from 'app/core/core-services/openslides-status.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { BaseSortListService } from 'app/core/ui-services/base-sort-list.service';
import { OsSortingDefinition, OsSortingOption } from 'app/core/ui-services/base-sort.service';
import { ViewAssignment } from '../models/view-assignment';

/**
 * Sorting service for the assignment list
 */
@Injectable({
    providedIn: 'root'
})
export class AssignmentSortListService extends BaseSortListService<ViewAssignment> {
    /**
     * set the storage key name
     */
    protected storageKey = 'AssignmentList';

    /**
     * Define the sort options
     */
    private assignmentSortOptions: OsSortingOption<ViewAssignment>[] = [
        { property: 'title', label: 'Name' },
        { property: 'phase', label: 'Phase' },
        { property: 'candidateAmount', label: 'Number of candidates' },
        { property: 'id', label: 'Creation date' }
    ];

    /**
     * Constructor.
     *
     * @param translate required by parent
     * @param storage required by parent
     */
    public constructor(translate: TranslateService, storage: StorageService, OSStatus: OpenSlidesStatusService) {
        super(translate, storage, OSStatus);
    }

    /**
     * @override
     */
    protected getSortOptions(): OsSortingOption<ViewAssignment>[] {
        return this.assignmentSortOptions;
    }

    /**
     * Required by parent
     *
     * @returns the default sorting strategy
     */
    public async getDefaultDefinition(): Promise<OsSortingDefinition<ViewAssignment>> {
        return {
            sortProperty: 'title',
            sortAscending: true
        };
    }
}
