import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar, MatDialog } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ListViewBaseComponent } from '../../../base/list-view-base';
import { LocalPermissionsService } from '../../services/local-permissions.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { MotionCsvExportService } from '../../services/motion-csv-export.service';
import { MotionFilterListService } from '../../services/motion-filter-list.service';
import { MotionMultiselectService } from '../../services/motion-multiselect.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { MotionSortListService } from '../../services/motion-sort-list.service';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { ViewCategory } from '../../models/view-category';
import { ViewMotion } from '../../models/view-motion';
import { ViewMotionBlock } from '../../models/view-motion-block';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewWorkflow } from '../../models/view-workflow';
import { WorkflowState } from 'app/shared/models/motions/workflow-state';
import { WorkflowRepositoryService } from 'app/core/repositories/motions/workflow-repository.service';
import { MotionPdfExportService } from '../../services/motion-pdf-export.service';
import { MotionExportDialogComponent } from '../motion-export-dialog/motion-export-dialog.component';
import { OperatorService } from 'app/core/core-services/operator.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';

/**
 * Component that displays all the motions in a Table using DataSource.
 */
@Component({
    selector: 'os-motion-list',
    templateUrl: './motion-list.component.html',
    styleUrls: ['./motion-list.component.scss']
})
export class MotionListComponent extends ListViewBaseComponent<ViewMotion> implements OnInit {
    /**
     * Columns to display in table when desktop view is available
     */
    public displayedColumnsDesktop: string[] = ['identifier', 'title', 'state', 'speakers'];

    /**
     * Columns to display in table when mobile view is available
     */
    public displayedColumnsMobile = ['identifier', 'title'];

    /**
     * Value of the configuration variable `motions_statutes_enabled` - are statutes enabled?
     * @TODO replace by direct access to config variable, once it's available from the templates
     */
    public statutesEnabled: boolean;
    public recomendationEnabled: boolean;

    public tags: ViewTag[] = [];
    public workflows: ViewWorkflow[] = [];
    public categories: ViewCategory[] = [];
    public motionBlocks: ViewMotionBlock[] = [];

    /**
     * Constructor implements title and translation Module.
     *
     * @param titleService Title
     * @param translate Translation
     * @param matSnackBar
     * @param router Router
     * @param route Current route
     * @param configService The configuration provider
     * @param repo Motion Repository
     * @param tagRepo Tag Repository
     * @param motionBlockRepo
     * @param categoryRepo
     * @param categoryRepo: Repo for categories. Used to define filters
     * @param workflowRepo: Repo for Workflows. Used to define filters
     * @param motionCsvExport
     * @param pdfExport To export motions as PDF
     * @param multiselectService Service for the multiSelect actions
     * @param userRepo
     * @param sortService
     * @param filterService
     * @param vp
     * @param perms LocalPermissionService
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute,
        private configService: ConfigService,
        private tagRepo: TagRepositoryService,
        private motionBlockRepo: MotionBlockRepositoryService,
        private categoryRepo: CategoryRepositoryService,
        private workflowRepo: WorkflowRepositoryService,
        private motionRepo: MotionRepositoryService,
        private motionCsvExport: MotionCsvExportService,
        private operator: OperatorService,
        private pdfExport: MotionPdfExportService,
        private dialog: MatDialog,
        private vp: ViewportService,
        public multiselectService: MotionMultiselectService,
        public sortService: MotionSortListService,
        public filterService: MotionFilterListService,
        public perms: LocalPermissionsService
    ) {
        super(titleService, translate, matSnackBar);

        // enable multiSelect for this listView
        this.canMultiSelect = true;
    }

    /**
     * Init function.
     *
     * Sets the title, inits the table, defines the filter/sorting options and
     * subscribes to filter and sorting services
     */
    public ngOnInit(): void {
        super.setTitle('Motions');
        this.initTable();
        this.configService
            .get<boolean>('motions_statutes_enabled')
            .subscribe(enabled => (this.statutesEnabled = enabled));
        this.configService
            .get<string>('motions_recommendations_by')
            .subscribe(recommender => (this.recomendationEnabled = !!recommender));
        this.motionBlockRepo.getViewModelListObservable().subscribe(mBs => (this.motionBlocks = mBs));
        this.categoryRepo.getViewModelListObservable().subscribe(cats => (this.categories = cats));
        this.tagRepo.getViewModelListObservable().subscribe(tags => (this.tags = tags));
        this.workflowRepo.getViewModelListObservable().subscribe(wfs => (this.workflows = wfs));
        this.filterService.filter().subscribe(filteredData => (this.sortService.data = filteredData));
        this.sortService.sort().subscribe(sortedData => {
            this.dataSource.data = sortedData;
            this.checkSelection();
        });
    }

    /**
     * The action performed on a click in single select modus
     * @param motion The row the user clicked at
     */
    public singleSelectAction(motion: ViewMotion): void {
        this.router.navigate(['./' + motion.id], { relativeTo: this.route });
    }

    /**
     * Get the icon to the corresponding Motion Status
     * TODO Needs to be more accessible (Motion workflow needs adjustment on the server)
     *
     * @param state the name of the state
     * @returns the icon string
     */
    public getStateIcon(state: WorkflowState): string {
        const stateName = state.name;
        if (stateName === 'accepted') {
            return 'thumb_up';
        } else if (stateName === 'rejected') {
            return 'thumb_down';
        } else if (stateName === 'not decided') {
            return 'help';
        } else {
            return '';
        }
    }

    /**
     * Determines if an icon should be shown in the list view
     *
     * @param state the workflowstate
     * @returns a boolean if the icon should be shown
     */
    public isDisplayIcon(state: WorkflowState): boolean {
        if (state) {
            return state.name === 'accepted' || state.name === 'rejected' || state.name === 'not decided';
        } else {
            return false;
        }
    }

    /**
     * Handler for the speakers button
     *
     * @param motion indicates the row that was clicked on
     */
    public onSpeakerIcon(motion: ViewMotion, event: MouseEvent): void {
        event.stopPropagation();
        this.router.navigate([`/agenda/${motion.agenda_item_id}/speakers`]);
    }

    /**
     * Handler for the plus button
     */
    public onPlusButton(): void {
        this.router.navigate(['./new'], { relativeTo: this.route });
    }

    /**
     * Opens the export dialog
     */
    public openExportDialog(): void {
        const exportDialogRef = this.dialog.open(MotionExportDialogComponent, {
            width: '950px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            data: this.dataSource
        });

        exportDialogRef.afterClosed().subscribe((result: any) => {
            if (result && result.format) {
                if (result.format === 'pdf') {
                    this.pdfExport.exportMotionCatalog(
                        this.dataSource.filteredData,
                        result.lnMode,
                        result.crMode,
                        result.content,
                        result.metaInfo
                    );
                } else if (result.format === 'csv') {
                    this.motionCsvExport.exportMotionList(
                        this.dataSource.filteredData,
                        result.content,
                        result.metaInfo
                    );
                }
            }
        });
    }

    /**
     * Returns current definitions for the listView table
     */
    public getColumnDefinition(): string[] {
        let columns = this.vp.isMobile ? this.displayedColumnsMobile : this.displayedColumnsDesktop;
        if (this.operator.hasPerms('core.can_manage_projector')) {
            columns = ['projector'].concat(columns);
        }
        if (this.isMultiSelect) {
            columns = ['selector'].concat(columns);
        }
        return columns;
    }

    /**
     * Wraps multiselect actions to close the multiselect mode or throw an error if one happens.
     *
     * @param multiselectPromise The promise returned by multiselect actions.
     */
    public async multiselectWrapper(multiselectPromise: Promise<void>): Promise<void> {
        try {
            await multiselectPromise;
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * Fetch a motion's current recommendation label
     *
     * @param motion
     * @returns the current recommendation label (with extension)
     */
    public getRecommendationLabel(motion: ViewMotion): string {
        return this.motionRepo.getExtendedRecommendationLabel(motion);
    }

    /**
     * Fetch a motion's current state label
     *
     * @param motion
     * @returns the current state label (with extension)
     */
    public getStateLabel(motion: ViewMotion): string {
        return this.motionRepo.getExtendedStateLabel(motion);
    }
}
