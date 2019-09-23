import { Injectable } from '@angular/core';

import { OpenSlidesStatusService } from 'app/core/core-services/openslides-status.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { BaseFilterListService, OsFilter } from 'app/core/ui-services/base-filter-list.service';
import { AssignmentPhases, ViewAssignment } from '../models/view-assignment';

/**
 * Filter service for the assignment list
 */
@Injectable({
    providedIn: 'root'
})
export class AssignmentFilterListService extends BaseFilterListService<ViewAssignment> {
    /**
     * set the storage key name
     */
    protected storageKey = 'AssignmentList';

    /**
     * FilterDefinitions for `AssignmentList` as class-member.
     */
    private assignmentFilterOptions: OsFilter[] = [
        {
            label: 'Phase',
            property: 'phase',
            options: AssignmentPhases.map(ap => {
                return { label: ap.display_name, condition: ap.value, isActive: false };
            })
        }
    ];

    /**
     * Constructor. Activates the phase options subscription
     *
     * @param store StorageService
     * @param translate translate service
     */
    public constructor(store: StorageService, OSStatus: OpenSlidesStatusService) {
        super(store, OSStatus);
    }

    /**
     * @returns the filter definition
     */
    protected getFilterDefinitions(): OsFilter[] {
        return this.assignmentFilterOptions;
    }
}
