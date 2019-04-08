import { Injectable } from '@angular/core';

import { AssignmentRepositoryService } from 'app/core/repositories/assignments/assignment-repository.service';
import { Assignment } from 'app/shared/models/assignments/assignment';
import { BaseFilterListService, OsFilter } from 'app/core/ui-services/base-filter-list.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { ViewAssignment, AssignmentPhase } from '../models/view-assignment';
import { ConstantsService } from 'app/core/ui-services/constants.service';

@Injectable({
    providedIn: 'root'
})
export class AssignmentFilterListService extends BaseFilterListService<Assignment, ViewAssignment> {
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
    public constructor(
        store: StorageService,
        assignmentRepo: AssignmentRepositoryService,
        private constants: ConstantsService
    ) {
        super(store, assignmentRepo);
        this.createPhaseOptions();
    }

    /**
     * Subscribes to the phases of an assignment that are defined in the server's
     * constants
     */
    private createPhaseOptions(): void {
        this.constants.get<AssignmentPhase[]>('AssignmentPhases').subscribe(phases => {
            this.phaseFilter.options = phases.map(ph => {
                return {
                    label: ph.display_name,
                    condition: ph.value,
                    isActive: false
                };
            });
        });
        this.updateFilterDefinitions(this.filterOptions);
    }
}
