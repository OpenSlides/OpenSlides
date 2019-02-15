import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { Assignment } from 'app/shared/models/assignments/assignment';
import { AssignmentFilterListService } from '../../services/assignment-filter.service';
import { AssignmentSortListService } from '../../services/assignment-sort-list.service';
import { AssignmentRepositoryService } from 'app/core/repositories/assignments/assignment-repository.service';
import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { OperatorService } from 'app/core/core-services/operator.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { ViewAssignment, AssignmentPhases } from '../../models/view-assignment';

/**
 * List view for the assignments
 */
@Component({
    selector: 'os-assignment-list',
    templateUrl: './assignment-list.component.html',
    styleUrls: ['./assignment-list.component.scss']
})
export class AssignmentListComponent extends ListViewBaseComponent<ViewAssignment, Assignment> implements OnInit {
    /**
     * The different phases of an assignment. Info is fetched from server
     */
    public phaseOptions = AssignmentPhases;

    /**
     * Constructor.
     *
     * @param titleService
     * @param storage
     * @param translate
     * @param matSnackBar
     * @param repo the repository
     * @param promptService
     * @param filterService: A service to supply the filtered datasource
     * @param sortService: Service to sort the filtered dataSource
     * @param route
     * @param router
     * @param operator
     */
    public constructor(
        titleService: Title,
        storage: StorageService,
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        public repo: AssignmentRepositoryService,
        private promptService: PromptService,
        public filterService: AssignmentFilterListService,
        public sortService: AssignmentSortListService,
        protected route: ActivatedRoute,
        private router: Router,
        public operator: OperatorService
    ) {
        super(titleService, translate, matSnackBar, route, storage, filterService, sortService);
        // activate multiSelect mode for this list view
        this.canMultiSelect = true;
    }

    /**
     * Init function.
     * Sets the title, inits the table
     */
    public ngOnInit(): void {
        super.setTitle('Elections');
        this.initTable();
    }

    /**
     * Handles a click on the plus button delegated from head-bar.
     * Creates a new assignment
     */
    public onPlusButton(): void {
        this.router.navigate(['./new'], { relativeTo: this.route });
    }

    /**
     * Action to be performed after a click on a row in the table, if in single select mode.
     * Navigates to the corresponding assignment
     *
     * @param assignment The entry of row clicked
     */
    public singleSelectAction(assignment: ViewAssignment): void {
        this.router.navigate([assignment.getDetailStateURL()], { relativeTo: this.route });
    }

    /**
     * Function to download the assignment list
     * TODO: Not yet implemented
     */
    public downloadAssignmentButton(): void {
        this.raiseError('TODO: assignment download not yet implemented');
    }

    /**
     * Handler for deleting multiple entries. Needs items in selectedRows, which
     * is only filled with any data in multiSelect mode
     */
    public async deleteSelected(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete all selected elections?');
        if (await this.promptService.open(title, '')) {
            for (const assignment of this.selectedRows) {
                await this.repo.delete(assignment);
            }
        }
    }

    /**
     * Fetch the column definitions for the data table
     *
     * @returns a list of string matching the columns
     */
    public getColumnDefintion(): string[] {
        const list = ['title', 'phase', 'candidates'];
        if (this.isMultiSelect) {
            return ['selector'].concat(list);
        }
        return list;
    }
}
