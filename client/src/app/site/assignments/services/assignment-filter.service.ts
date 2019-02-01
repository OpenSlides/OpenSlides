import { Injectable } from '@angular/core';

import { AssignmentRepositoryService } from '../../../core/repositories/assignments/assignment-repository.service';
import { Assignment, assignmentPhase } from '../../../shared/models/assignments/assignment';
import { BaseFilterListService, OsFilter, OsFilterOption } from '../../../core/ui-services/base-filter-list.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { ViewAssignment } from '../models/view-assignment';

@Injectable({
    providedIn: 'root'
})
export class AssignmentFilterListService extends BaseFilterListService<Assignment, ViewAssignment> {
    protected name = 'Assignment';

    public filterOptions: OsFilter[];

    public constructor(store: StorageService, assignmentRepo: AssignmentRepositoryService) {
        super(store, assignmentRepo);
        this.filterOptions = [
            {
                property: 'phase',
                options: this.createPhaseOptions()
            }
        ];
    }

    private createPhaseOptions(): OsFilterOption[] {
        const options = [];
        assignmentPhase.forEach(phase => {
            options.push({
                label: phase.name,
                condition: phase.key,
                isActive: false
            });
        });
        options.push('-');
        options.push({
            label: 'Other',
            condition: null
        });
        return options;
    }
}
