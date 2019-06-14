import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar, MatDialog } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { WorkflowRepositoryService } from 'app/core/repositories/motions/workflow-repository.service';
import { MotionExportDialogComponent } from '../motion-export-dialog/motion-export-dialog.component';
import { ViewMotion, LineNumberingMode, ChangeRecoMode } from 'app/site/motions/models/view-motion';
import { ViewWorkflow } from 'app/site/motions/models/view-workflow';
import { ViewCategory } from 'app/site/motions/models/view-category';
import { ViewMotionBlock } from 'app/site/motions/models/view-motion-block';
import { MotionSortListService } from 'app/site/motions/services/motion-sort-list.service';
import { MotionFilterListService } from 'app/site/motions/services/motion-filter-list.service';
import { MotionCsvExportService } from 'app/site/motions/services/motion-csv-export.service';
import { MotionPdfExportService } from 'app/site/motions/services/motion-pdf-export.service';
import { MotionMultiselectService } from 'app/site/motions/services/motion-multiselect.service';
import { MotionXlsxExportService } from 'app/site/motions/services/motion-xlsx-export.service';
import { LocalPermissionsService } from 'app/site/motions/services/local-permissions.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { PdfError } from 'app/core/ui-services/pdf-document.service';
import { ColumnRestriction } from 'app/shared/components/list-view-table/list-view-table.component';

interface TileCategoryInformation {
    filter: string;
    name: string;
    prefix?: string;
    condition: number | boolean | null;
    amountOfMotions: number;
}

/**
 * Interface to describe possible values and changes for
 * meta information dialog.
 */
interface InfoDialog {
    /**
     * The title of the motion
     */
    title: string;

    /**
     * The motion block id
     */
    motionBlock: number;

    /**
     * The category id
     */
    category: number;

    /**
     * The motions tag ids
     */
    tags: number[];
}

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
     * Reference to the dialog for quick editing meta information.
     */
    @ViewChild('motionInfoDialog')
    private motionInfoDialog: TemplateRef<string>;

    /**
     * Interface to hold meta information.
     */
    public infoDialog: InfoDialog;

    /**
     * String to define the current selected view.
     */
    public selectedView: string;

    /**
     * Columns to display in table when desktop view is available
     * Define the columns to show
     */
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'identifier'
        },
        {
            prop: 'title',
            width: 'auto'
        },
        {
            prop: 'state',
            width: '20%',
            minWidth: 160
        },
        {
            prop: 'speaker'
        }
    ];

    /**
     * Value of the configuration variable `motions_statutes_enabled` - are statutes enabled?
     * @TODO replace by direct access to config variable, once it's available from the templates
     */
    public statutesEnabled: boolean;

    /**
     * Value of the config variable `motions_show_sequential_numbers`
     */
    public showSequential: boolean;

    public recommendationEnabled: boolean;

    public tags: ViewTag[] = [];
    public workflows: ViewWorkflow[] = [];
    public categories: ViewCategory[] = [];
    public motionBlocks: ViewMotionBlock[] = [];

    public restrictedColumns: ColumnRestriction[] = [
        {
            columnName: 'speaker',
            permission: 'agenda.can_see'
        }
    ];

    /**
     * List of `TileCategoryInformation`.
     * Necessary to not iterate over the values of the map below.
     */
    public tileCategories: TileCategoryInformation[] = [];

    /**
     * Map of information about the categories relating to their id.
     */
    public informationOfMotionsInTileCategories: { [id: number]: TileCategoryInformation } = {};

    /**
     * The verbose name for the motions.
     */
    public motionsVerboseName: string;

    /**
     * Constructor implements title and translation Module.
     *
     * @param titleService Title
     * @param translate Translation
     * @param matSnackBar showing errors
     * @param sortService sorting
     * @param filterService filtering
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
     * @param vp
     * @param perms LocalPermissionService
     */
    public constructor(
        titleService: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        private route: ActivatedRoute,
        storage: StorageService,
        public filterService: MotionFilterListService,
        public sortService: MotionSortListService,
        private router: Router,
        private configService: ConfigService,
        private tagRepo: TagRepositoryService,
        private motionBlockRepo: MotionBlockRepositoryService,
        private categoryRepo: CategoryRepositoryService,
        private workflowRepo: WorkflowRepositoryService,
        public motionRepo: MotionRepositoryService,
        private motionCsvExport: MotionCsvExportService,
        private pdfExport: MotionPdfExportService,
        private dialog: MatDialog,
        public multiselectService: MotionMultiselectService,
        public perms: LocalPermissionsService,
        private motionXlsxExport: MotionXlsxExportService
    ) {
        super(titleService, translate, matSnackBar, storage);
        this.canMultiSelect = true;
    }

    /**
     * Init function.
     *
     * Sets the title, inits the table, defines the filter/sorting options and
     * subscribes to filter and sorting services
     */
    public async ngOnInit(): Promise<void> {
        super.setTitle('Motions');
        const storedView = await this.storage.get<string>('motionListView');

        this.configService
            .get<boolean>('motions_statutes_enabled')
            .subscribe(enabled => (this.statutesEnabled = enabled));
        this.configService.get<string>('motions_recommendations_by').subscribe(recommender => {
            this.recommendationEnabled = !!recommender;
        });
        this.configService
            .get<boolean>('motions_show_sequential_numbers')
            .subscribe(show => (this.showSequential = show));
        this.motionBlockRepo.getViewModelListObservable().subscribe(mBs => {
            this.motionBlocks = mBs;
        });
        this.categoryRepo.getViewModelListObservable().subscribe(cats => {
            this.categories = cats;
            if (cats.length > 0) {
                this.selectedView = storedView || 'tiles';
            } else {
                this.selectedView = 'list';
            }
        });
        this.tagRepo.getViewModelListObservable().subscribe(tags => {
            this.tags = tags;
        });
        this.workflowRepo.getViewModelListObservable().subscribe(wfs => (this.workflows = wfs));

        this.motionRepo.getViewModelListObservable().subscribe(motions => {
            if (motions && motions.length) {
                this.createTiles(motions);
            }
        });
    }

    private createTiles(motions: ViewMotion[]): void {
        this.informationOfMotionsInTileCategories = {};
        for (const motion of motions) {
            if (motion.star) {
                this.countMotions(-1, true, 'star', 'Favorites');
            }

            if (motion.category_id) {
                this.countMotions(
                    motion.category_id,
                    motion.category_id,
                    'category',
                    motion.category.name,
                    motion.category.prefix
                );
            } else {
                this.countMotions(-2, null, 'category', 'No category');
            }
        }

        this.tileCategories = Object.values(this.informationOfMotionsInTileCategories);
    }

    /**
     * Handler for the plus button
     */
    public onPlusButton(): void {
        this.router.navigate(['./new'], { relativeTo: this.route });
    }

    /**
     * Opens the export dialog.
     * The export will be limited to the selected data if multiselect modus is
     * active and there are rows selected
     */
    public openExportDialog(): void {
        const exportDialogRef = this.dialog.open(MotionExportDialogComponent, {
            width: '1100px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            data: this.dataSource
        });

        exportDialogRef.afterClosed().subscribe((result: any) => {
            if (result && result.format) {
                const data = this.isMultiSelect ? this.selectedRows : this.dataSource.source;
                if (result.format === 'pdf') {
                    try {
                        this.pdfExport.exportMotionCatalog(
                            data,
                            result.lnMode,
                            result.crMode,
                            result.content,
                            result.metaInfo,
                            result.comments
                        );
                    } catch (err) {
                        if (err instanceof PdfError) {
                            this.raiseError(err.message);
                        } else {
                            throw err;
                        }
                    }
                } else if (result.format === 'csv') {
                    this.motionCsvExport.exportMotionList(data, [...result.content, ...result.metaInfo], result.crMode);
                } else if (result.format === 'xlsx') {
                    this.motionXlsxExport.exportMotionList(data, result.metaInfo);
                }
            }
        });
    }

    /**
     * Function to count the motions in their related categories.
     *
     * @param id The key of TileCategory in `informationOfMotionsInTileCategories` object
     * @param condition The condition, if the tile is selected
     * @param filter The filter, if the tile is selected
     * @param name The title of the tile
     * @param prefix The prefix of the category
     */
    private countMotions(
        id: number,
        condition: number | boolean | null,
        filter: string,
        name: string,
        prefix?: string
    ): void {
        let info = this.informationOfMotionsInTileCategories[id];
        if (info) {
            ++info.amountOfMotions;
        } else {
            info = {
                filter,
                name,
                condition,
                prefix,
                amountOfMotions: 1
            };
        }
        this.informationOfMotionsInTileCategories[id] = info;
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

    /**
     * Directly export all motions as pdf, using the current default config settings
     */
    public directPdfExport(): void {
        this.pdfExport.exportMotionCatalog(
            this.dataSource.source,
            this.configService.instant<string>('motions_default_line_numbering') as LineNumberingMode,
            this.configService.instant<string>('motions_recommendation_text_mode') as ChangeRecoMode
        );
    }

    /**
     * Overwrites the dataSource's string filter with a case-insensitive search
     * in the identifier, title, state, recommendations, submitters, motion blocks and id
     *
     * TODO: Does currently not work with virtual scrolling tables. Filter predicates will be missed :(
     */
    // private setFulltextFilter(): void {
    //     this.dataSource.filterPredicate = (data, filter) => {
    //         if (!data) {
    //             return false;
    //         }
    //         filter = filter ? filter.toLowerCase() : '';
    //         if (data.submitters.length && data.submitters.find(user => user.full_name.toLowerCase().includes(filter))) {
    //             return true;
    //         }
    //         if (data.motion_block && data.motion_block.title.toLowerCase().includes(filter)) {
    //             return true;
    //         }
    //         if (data.title.toLowerCase().includes(filter)) {
    //             return true;
    //         }
    //         if (data.identifier && data.identifier.toLowerCase().includes(filter)) {
    //             return true;
    //         }

    //         if (
    //             this.getStateLabel(data) &&
    //             this.getStateLabel(data)
    //                 .toLocaleLowerCase()
    //                 .includes(filter)
    //         ) {
    //             return true;
    //         }

    //         if (
    //             this.getRecommendationLabel(data) &&
    //             this.getRecommendationLabel(data)
    //                 .toLocaleLowerCase()
    //                 .includes(filter)
    //         ) {
    //             return true;
    //         }

    //         const dataid = '' + data.id;
    //         if (dataid.includes(filter)) {
    //             return true;
    //         }

    //         return false;
    //     };
    // }

    /**
     * This function saves the selected view by changes.
     *
     * @param value is the new view the user has selected.
     */
    public onChangeView(value: string): void {
        this.selectedView = value;
        this.storage.set('motionListView', value);
    }

    /**
     * This function changes the view to the list of motions where the selected category becomes the active filter.
     *
     * @param tileCategory information about filter and condition.
     */
    public changeToViewWithTileCategory(tileCategory: TileCategoryInformation): void {
        this.onChangeView('list');
        this.filterService.clearAllFilters();
        this.filterService.toggleFilterOption(tileCategory.filter, {
            label: tileCategory.name,
            condition: tileCategory.condition,
            isActive: false
        });
    }

    /**
     * Opens a dialog to edit some meta information about a motion.
     *
     * @param motion the ViewMotion whose content is edited.
     * @param ev a MouseEvent.
     */
    public async openEditInfo(motion: ViewMotion): Promise<void> {
        if (!this.isMultiSelect) {
            // The interface holding the current information from motion.
            this.infoDialog = {
                title: motion.title,
                motionBlock: motion.motion_block_id,
                category: motion.category_id,
                tags: motion.tags_id
            };

            // Copies the interface to check, if changes were made.
            const copyDialog = { ...this.infoDialog };

            const dialogRef = this.dialog.open(this.motionInfoDialog, {
                width: '400px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                disableClose: true
            });

            dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
                if (event.key === 'Enter' && event.shiftKey) {
                    dialogRef.close(this.infoDialog);
                }
            });

            // After closing the dialog: Goes through the fields and check if they are changed
            // TODO: Logic like this should be handled in a service
            dialogRef.afterClosed().subscribe(async (result: InfoDialog) => {
                if (result) {
                    const partialUpdate = {
                        category_id: result.category !== copyDialog.category ? result.category : undefined,
                        motion_block_id: result.motionBlock !== copyDialog.motionBlock ? result.motionBlock : undefined,
                        tags_id:
                            JSON.stringify(result.tags) !== JSON.stringify(copyDialog.tags) ? result.tags : undefined
                    };
                    // TODO: "only update if different" was another repo-todo
                    if (!Object.keys(partialUpdate).every(key => partialUpdate[key] === undefined)) {
                        await this.motionRepo.update(partialUpdate, motion).then(null, this.raiseError);
                    }
                }
            });
        }
    }

    /**
     * Checks if categories are available.
     *
     * @returns A boolean if they are available.
     */
    public isCategoryAvailable(): boolean {
        return !!this.categories && this.categories.length > 0;
    }

    /**
     * Checks if tags are available.
     *
     * @returns A boolean if they are available.
     */
    public isTagAvailable(): boolean {
        return !!this.tags && this.tags.length > 0;
    }

    /**
     * Checks motion-blocks are available.
     *
     * @returns A boolean if they are available.
     */
    public isMotionBlockAvailable(): boolean {
        return !!this.motionBlocks && this.motionBlocks.length > 0;
    }
}
