import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { AssignmentRepositoryService } from 'app/core/repositories/assignments/assignment-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { AssignmentFilterListService } from '../../services/assignment-filter-list.service';
import { AssignmentPdfExportService } from '../../services/assignment-pdf-export.service';
import { AssignmentSortListService } from '../../services/assignment-sort-list.service';
import { AssignmentPhases, ViewAssignment } from '../../models/view-assignment';

/**
 * List view for the assignments
 */
@Component({
    selector: 'os-assignment-list',
    templateUrl: './assignment-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./assignment-list.component.scss']
})
export class AssignmentListComponent extends BaseListViewComponent<ViewAssignment> implements OnInit {
    /**
     * The different phases of an assignment. Info is fetched from server
     */
    public phaseOptions = AssignmentPhases;

    /**
     * Define the columns to show
     */
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'title',
            width: 'auto'
        },
        {
            prop: 'phase',
            width: '20%',
            minWidth: 180
        },
        {
            prop: 'candidates',
            width: this.singleButtonWidth
        }
    ];

    /**
     * Define extra filter properties
     */
    public filterProps = ['title', 'candidates', 'assignment_related_users', 'tags', 'candidateAmount'];

    public get canManageAssignments(): boolean {
        return this.operator.hasPerms(Permission.assignmentsCanManage);
    }

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
        private pdfService: AssignmentPdfExportService,
        protected route: ActivatedRoute,
        private router: Router,
        private operator: OperatorService,
        public vp: ViewportService
    ) {
        super(titleService, translate, matSnackBar, storage);
        this.canMultiSelect = true;
    }

    /**
     * Init function.
     * Sets the title, inits the table
     */
    public ngOnInit(): void {
        super.setTitle('Elections');
    }

    /**
     * Handles a click on the plus button delegated from head-bar.
     * Creates a new assignment
     */
    public onPlusButton(): void {
        this.router.navigate(['./new'], { relativeTo: this.route });
    }

    /**
     * @returns all the identifier of the columns that should be hidden in mobile
     */
    public getColumnsHiddenInMobile(): string[] {
        const hiddenInMobile = ['phase', 'candidates'];

        if (!this.operator.hasPerms(Permission.agendaCanSeeListOfSpeakers, Permission.coreCanManageProjector)) {
            hiddenInMobile.push('menu');
        }

        return hiddenInMobile;
    }

    /**
     * Function to download the assignment list
     *
     * @param assignments Optional parameter: If given, the chosen list will be exported,
     * otherwise the whole list of assignments is exported.
     */
    public downloadAssignmentButton(assignments?: ViewAssignment[]): void {
        this.pdfService.exportMultipleAssignments(assignments ? assignments : this.repo.getViewModelList());
    }

    /**
     * Handler for deleting multiple entries. Needs items in selectedRows, which
     * is only filled with any data in multiSelect mode
     */
    public async deleteSelected(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete all selected elections?');
        if (await this.promptService.open(title)) {
            for (const assignment of this.selectedRows) {
                await this.repo.delete(assignment);
            }
        }
    }
}
