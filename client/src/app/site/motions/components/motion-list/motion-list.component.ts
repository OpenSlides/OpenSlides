import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '../../../../core/services/config.service';
import { MotionCsvExportService } from '../../services/motion-csv-export.service';
import { ListViewBaseComponent } from '../../../base/list-view-base';
import { MatSnackBar } from '@angular/material';
import { MotionRepositoryService } from '../../services/motion-repository.service';
import { ViewMotion } from '../../models/view-motion';
import { WorkflowState } from '../../../../shared/models/motions/workflow-state';
import { MotionMultiselectService } from '../../services/motion-multiselect.service';
import { TagRepositoryService } from 'app/site/tags/services/tag-repository.service';
import { MotionBlockRepositoryService } from '../../services/motion-block-repository.service';
import { CategoryRepositoryService } from '../../services/category-repository.service';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewWorkflow } from '../../models/view-workflow';
import { ViewCategory } from '../../models/view-category';
import { ViewMotionBlock } from '../../models/view-motion-block';
import { WorkflowRepositoryService } from '../../services/workflow-repository.service';

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
     * Use for minimal width. Please note the 'selector' row for multiSelect mode,
     * to be able to display an indicator for the state of selection
     */
    public columnsToDisplayMinWidth = ['identifier', 'title', 'state', 'speakers'];

    /**
     * Use for maximal width. Please note the 'selector' row for multiSelect mode,
     * to be able to display an indicator for the state of selection
     * TODO: Needs vp.desktop check
     */
    public columnsToDisplayFullWidth = ['identifier', 'title', 'state', 'speakers'];

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
     * @param motionCsvExport
     * @param multiselectService Service for the multiSelect actions
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute,
        private configService: ConfigService,
        private repo: MotionRepositoryService,
        private tagRepo: TagRepositoryService,
        private motionBlockRepo: MotionBlockRepositoryService,
        private categoryRepo: CategoryRepositoryService,
        private workflowRepo: WorkflowRepositoryService,
        private motionCsvExport: MotionCsvExportService,
        public multiselectService: MotionMultiselectService
    ) {
        super(titleService, translate, matSnackBar);

        // enable multiSelect for this listView
        this.canMultiSelect = true;
    }

    /**
     * Init function.
     *
     * Sets the title, inits the table and calls the repository
     */
    public ngOnInit(): void {
        super.setTitle('Motions');
        this.initTable();
        this.repo.getViewModelListObservable().subscribe(newMotions => {
            // TODO: This is for testing purposes. Can be removed with #3963
            this.dataSource.data = newMotions.sort((a, b) => {
                if (a.callListWeight !== b.callListWeight) {
                    return a.callListWeight - b.callListWeight;
                } else {
                    return a.id - b.id;
                }
            });
            this.checkSelection();
        });
        this.configService.get('motions_statutes_enabled').subscribe(enabled => (this.statutesEnabled = enabled));
        this.configService.get('motions_recommendations_by').subscribe(id => (this.recomendationEnabled = !!id));
        this.motionBlockRepo.getViewModelListObservable().subscribe(mBs => this.motionBlocks = mBs);
        this.categoryRepo.getViewModelListObservable().subscribe(cats => this.categories = cats);
        this.tagRepo.getViewModelListObservable().subscribe(tags => this.tags = tags);
        this.workflowRepo.getViewModelListObservable().subscribe(wfs => this.workflows = wfs);
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
     * Export all motions as CSV
     */
    public csvExportMotionList(): void {
        this.motionCsvExport.exportMotionList(this.dataSource.data);
    }

    /**
     * Returns current definitions for the listView table
     */
    public getColumnDefinition(): string[] {
        if (this.isMultiSelect) {
            return ['selector'].concat(this.columnsToDisplayMinWidth);
        }
        return this.columnsToDisplayMinWidth;
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
}
