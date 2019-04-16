import { Injectable } from '@angular/core';

import { AssignmentRepositoryService } from 'app/core/repositories/assignments/assignment-repository.service';
import { BaseFilterListService, OsFilter } from 'app/core/ui-services/base-filter-list.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { ViewAssignment, AssignmentPhases } from '../models/view-assignment';

@Injectable({
    providedIn: 'root'
})
export class AssignmentFilterListService extends BaseFilterListService<ViewAssignment> {
    protected name = 'Assignment';

    /**
     * Getter for the current filter options
     *
     * @returns filter definitions to use
     */
    public get filterOptions(): OsFilter[] {
        return [this.phaseFilter];
    }

    /**
     * Filter for assignment phases. Defined in the servers' constants
     */
    public phaseFilter: OsFilter = {
        property: 'phase',
        options: []
    };

    /**
     * Constructor. Activates the phase options subscription
     *
     * @param store StorageService
     * @param assignmentRepo Repository
     * @param constants the openslides constant service to get the assignment options
     */
    public constructor(store: StorageService, assignmentRepo: AssignmentRepositoryService) {
        super(store, assignmentRepo);
        this.createPhaseOptions();
    }

    /**
     * Subscribes to the phases of an assignment that are defined in the server's
     * constants
     */
    private createPhaseOptions(): void {
        this.phaseFilter.options = AssignmentPhases.map(ap => {
            return { label: ap.display_name, condition: ap.value, isActive: false };
        });
        this.updateFilterDefinitions(this.filterOptions);
    }
}
